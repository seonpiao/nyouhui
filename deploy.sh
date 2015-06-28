#!/bin/bash

config=$1

GetKey(){    
  section=$(echo $1 | cut -d '.' -f 1)    
  key=$(echo $1 | cut -d '.' -f 2)    
  sed -n "/\[$section\]/,/\[.*\]/{    
   /^\[.*\]/d
   /^[ \t]*$/d
   /^$/d
   /^#.*$/d
   s/^[ \t]*$key[ \t]*=[ \t]*\(.*\)[ \t]*/\1/p
  }" $config
}

hosts=($(GetKey "server.node"))
static_host=$(GetKey "server.static")
static_online_host="online.$static_host"
static_check_url="http://$static_online_host/"
server_path=$(GetKey "path.dist")
server_code=$(GetKey "path.code")
pm2_pname=$(GetKey "pm2.index")
upload_dirs=($(GetKey "path.upload"))
npm_path=$(GetKey "path.npm")
pm2_path=$(GetKey "path.pm2")
git_remote=$(GetKey "git.remote")
git_branch=$(GetKey "git.branch")

num=${#hosts[@]}

gitmergeconfilict=($(grep ">>>>>>>" ./ -r --exclude-dir=node_modules | grep -v deploy.sh | awk -F ':' '{print $1}' | sed  's/\/\{1,\}/\//g'))
gitmergeconfilictcount=${#gitmergeconfilict[@]}

if [ $gitmergeconfilictcount -gt 0 ]; then
  echo '有以下冲突没有处理：'
  for((i=0;i<gitmergeconfilictcount;i++));do
    echo ${gitmergeconfilict[i]}
  done
  exit
fi

gitchange=($(git status -bs | grep "^[^#]"))
gitchangecount=${#gitchange[@]}

if [ $gitchangecount -gt 0 ]; then
  echo '请先提交代码的修改'
  exit
fi

gitahead=($(git status -bs | grep "ahead \d"))
gitaheadcount=${#gitahead[@]}

if [ $gitaheadcount -gt 0 ]; then
  echo '请先把代码push到server'
  exit
fi

if [ "$env" = "test" ]; then
  if [ "$(git status |awk 'NR==1 {print $3}')x" != "${git_branch}x" ]; then
    echo "Please enter checkout ${git_branch}"
    exit
  fi
fi
# if [ "$env" = "production" ]; then
#   choice="n"
read -p "Deploy branch(${git_branch}) to ${hosts[*]}: (y/n)" choice
# fi

if [ "$choice" = "y" ]; then

  rm -rf dist
  rm -rf temp

  #编译代码
  grunt build

  #提交git
  git add .
  if [[ $userFlag = true ]]; then
    git commit -m "online for $user"
  else
    git commit -m online 
  fi

  git push $git_remote $git_branch
  
  #备份dist到temp，后续还需要还原回来
  cp -rf dist/ temp/

  #把编译好的文件上传到server
  dircount=${#upload_dirs[@]}
  str=""
  for((i=0;i<dircount;i++));do
    #删除不带md5值的文件，这些文件不需要提交到服务器上
    if [ "${upload_dirs[i]}" != "images" ]; then
      find dist/${upload_dirs[i]}/ -name "*.*"  | grep -v '\.\w\{16\}\.' | sed  's/\/\{1,\}/\//g' | xargs rm -f
    fi
    #copy到static server
    ssh root@$static_online_host "mkdir -p $server_path/${upload_dirs[i]}"
    scp -r dist/${upload_dirs[i]}/* root@$static_online_host:$server_path/${upload_dirs[i]}
    str="${str} ./dist/${upload_dirs[i]}"
  done

  #还原dist的文件
  cp -rf temp/ dist/

  # 检查是否所有文件已经同步到线上
  files=($(find ${str} -name "*.*"  | grep '\.\w\{16\}\.' | awk -F '^./' '{print $2}' | sed 's/\/\//\//g'))
  filescount=${#files[@]}
  for((i=0;i<filescount;i++));do
    static_file_url="${static_check_url}${files[i]}"
    httpcode=""
    while [ "$httpcode" != "200" ]
    do
      httpcode=`curl -I -o /dev/null -s -w %{http_code} -H Host:${static_host} ${static_file_url}`
      echo "$httpcode - ${static_file_url}"
      wait
      if [ "$httpcode" != "200" ]; then
        sleep 10s
      fi
    done
  done

  #更新Node服务
  for((i=0;i<num;i++));do
    echo deploy to ${hosts[i]}
    ssh root@${hosts[i]} "cd ${server_code} && git pull && $npm_path install && $pm2_path reload ${pm2_pname}"
  done
fi
