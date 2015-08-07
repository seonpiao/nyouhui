read -p "是否已经生成ssh key,并且添加到gitlab中？ (y/n)" choice

if [ ! "$choice" = "y" ]; then
  exit
fi

node_ver="0.12.5"
node_tar_filename="node-v$node_ver-linux-x64.tar.gz"
node_dirname="node-v$node_ver-linux-x64"
node_path="/usr/local/node"

code_path="/root/code"
code_prjname="firstre"
code_git="git@git.dev.bylh.tv:bfe/$code_prjname.git"

nginx_site=(manage m api)
nginx_logpath="/var/log/nginx/$code_prjname"

node_installed="yes"
hash node 2>/dev/null || node_installed="no"

if [ "$node_installed" = "no" ]; then
  tar -xf $node_tar_filename
  if [ ! -d "$node_path" ]; then
    mkdir -p $node_path
  fi
  cp -rn $node_dirname/* $node_path
  ln -s $node_path/bin/node /usr/bin/node
  set_path_str="PATH=\$PATH:$node_path/bin"
  bash_profile=`cat ~/.bash_profile`
  if [[ ! $bash_profile =~ "$set_path_str" ]]; then
    echo "PATH=\$PATH:$node_path/bin" >> ~/.bash_profile
    echo "export PATH" >> ~/.bash_profile
  fi
fi

mongod_installed="yes"
hash mongod 2>/dev/null || mongod_installed="no"

if [ "$mongod_installed" = "no" ]; then
  yum install -y mongodb-server
  mongod -f /etc/mongodb.conf
fi

redis_installed="yes"
hash redis-server 2>/dev/null || redis_installed="no"

if [ "$redis_installed" = "no" ]; then
  yum install -y redis
  redis-server /etc/redis.conf
fi

git_installed="yes"
hash git 2>/dev/null || git_installed="no"

if [ "$git_installed" = "no" ]; then
  yum install -y git
fi

if [ ! -d "$code_path" ]; then
  mkdir -p $code_path
fi
cd $code_path
if [ ! -d "$code_prjname" ]; then
  git clone $code_git
fi
cd $code_prjname
npm install

pm2_installed="yes"
hash pm2 2>/dev/null || pm2_installed="no"

if [ "$pm2_installed" = "no" ]; then
  npm install -g pm2
fi

nginx_installed="yes"
hash nginx 2>/dev/null || nginx_installed="no"

if [ "$nginx_installed" = "no" ]; then
  yum install -y nginx
fi

cd $code_path/$code_prjname
cp install/nginx.conf /etc/nginx/nginx.conf <<< "n"
cp install/site.conf /etc/nginx/conf.d/$code_prjname.conf <<< "n"
nginx_site_count=${#nginx_site[@]}
for((i=0;i<nginx_site_count;i++));do
  tmp_path="$nginx_logpath/${nginx_site[i]}"
  if [ ! -d "$tmp_path" ]; then
    mkdir -p $tmp_path
  fi
done

for name in $(ls apps -F | grep /)
do
  if [ -f "apps/${name}/install.js" ]; then
    node --harmony apps/${name}/install.js
  fi
done

pcount=`ps -ef | grep -c nginx`
if [[ $pcount -le 1 ]]; then
nginx
fi
nginx -s reload
