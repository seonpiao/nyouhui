#!/bin/bash

test=(117.121.10.98)
production=(117.121.10.98)
staticurl="http://online.static.nyouhui.com/"
static_host="static.nyouhui.com"
server_host="117.121.10.98"
server_path="/data/www/nyouhui.com/static/dist"
server_code="/root/code/nyouhui"
pm2_pname="index"
upload_dirs=(js css template)

users=(seon)

env=$1
user=$2
branch=$3

if [ "$3" = "" ]; then
  branch=$user
fi

user=($(echo $2 | sed s/\[0-9\]\$//))

if [ "$env" = "production" ]; then
  hosts=(${production[@]})
elif [ "$env" = "test" ]; then
  hosts=(${test[@]})
  for loop in ${users[@]}
  do
    if [[ $loop = $user ]]
    then
      userFlag=true
    fi
  done

  if [[ $userFlag = true ]]; then
    echo "${user}:" > /dev/null
  else
    echo "请写出你的美名，wujunlian or seon or feng"
    exit
  fi

else
  echo '请指定正确的上线环境，test or production'
  exit
fi

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
  if [ "$(git status |awk 'NR==1 {print $3}')x" != "${branch}x" ]; then
    echo "Please enter checkout ${branch}"
    exit
  fi
fi
# if [ "$env" = "production" ]; then
#   choice="n"
read -p "Deploy branch(${branch}) to ${hosts[*]}: (y/n)" choice
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
  git push
  
  #备份dist到temp，后续还需要还原回来
  cp -rf dist/ temp/

  #把编译好的文件上传到server
  dircount=${#upload_dirs[@]}
  str=""
  for((i=0;i<dircount;i++));do
    #删除不带md5值的文件，这些文件不需要提交到服务器上
    find dist/${upload_dirs[i]}/ -name "*.*"  | grep -v '\.\w\{16\}\.' | sed  's/\/\{1,\}/\//g' | xargs rm -f
    #copy到static server
    scp -r dist/${upload_dirs[i]}/ root@$server_host:$server_path
    str="${str} ./dist/${upload_dirs[i]}"
  done

  #还原dist的文件
  cp -rf temp/ dist/

  # 检查是否所有文件已经同步到线上
  files=($(find ${str} -name "*.*"  | grep '\.\w\{16\}\.' | awk -F '^./' '{print $2}' | sed 's/\/\//\//g'))
  filescount=${#files[@]}
  for((i=0;i<filescount;i++));do
    staticfileurl="${staticurl}${files[i]}"
    httpcode=""
    while [ "$httpcode" != "200" ]
    do
      httpcode=`curl -I -o /dev/null -s -w %{http_code} -H Host:${static_host} ${staticfileurl}`
      echo "$httpcode - ${staticfileurl}"
      wait
      if [ "$httpcode" != "200" ]; then
        sleep 10s
      fi
    done
  done

  #更新Node服务
  for((i=0;i<num;i++));do
    echo deploy to ${hosts[i]}
    if [ "$env" = "production" ]; then
      ssh root@${hosts[i]} "dsh -M -r ssh -g node -q -- 'cd ${server_code} && git pull && /usr/local/node/bin/npm install && /usr/local/node/bin/pm2 reload ${pm2_pname}'"
    else
      ssh root@${hosts[i]} "cd /root/code/$2 && git fetch && git checkout ${branch} && git pull && /usr/local/node/bin/npm install && /usr/local/bin/pm2 reload $2"
    fi
  done
fi
