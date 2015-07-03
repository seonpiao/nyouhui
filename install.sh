node_ver="0.12.5"
node_tar_filename="node-v$node_ver-linux-x64.tar.gz"
node_dirname="node-v$node_ver-linux-x64"
node_path="/usr/local/node"

#wget https://nodejs.org/dist/v$node_ver/$node_tar_filename
tar -xf $node_tar_filename
if [ ! -d "$node_path" ]; then 
  mkdir -p $node_path
fi
cp -rn $node_dirname/* $node_path
set_path_str="PATH=\$PATH:$node_path/bin"
bash_profile=`cat ~/.bash_profile`
if [[ $bash_profile =~ "$set_path_str" ]]; then
  echo "PATH=\$PATH:$node_path/bin" >> ~/.bash_profile
  echo "export PATH" >> ~/.bash_profile
fi

yum install -y nginx
cp install/nginx.conf /etc/nginx/nginx.conf <<< "y"
cp install/site.conf /etc/nginx/conf.d/nginx.conf <<< "y"
nginx
nginx -s reload