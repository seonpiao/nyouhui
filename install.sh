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
nginx_logpath="/var/log/nginx/firstre"

wget https://nodejs.org/dist/v$node_ver/$node_tar_filename
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

yum install -y mongodb-server
mongod -f /etc/mongodb.conf
yum install -y redis
redis-server /etc/redis.conf

yum install -y git
if [ ! -d "$code_path" ]; then 
  mkdir -p $code_path
fi
cd $code_path
if [ ! -d "$code_prjname" ]; then 
  git clone $code_git
fi
cd $code_prjname
npm install
npm install -g pm2

yum install -y nginx
cd $code_path/$code_prjname
cp install/nginx.conf /etc/nginx/nginx.conf <<< "y"
cp install/site.conf /etc/nginx/conf.d/site.conf <<< "y"
nginx_site_count=${#nginx_site[@]}
for((i=0;i<nginx_site_count;i++));do
  tmp_path="$nginx_logpath/${nginx_site[i]}"
  if [ ! -d "$tmp_path" ]; then
    mkdir -p $tmp_path
  fi
done
nginx
nginx -s reload