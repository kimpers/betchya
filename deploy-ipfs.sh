rm -rf build_webpack
yarn build

echo "Replacing paths in project to be relative..."
find build_webpack/static/ -type f -exec sed -i 's/\/fonts\//..\/..\/fonts\//g' {} \;
find build_webpack/index.html -type f -exec sed -i 's/\/static\//.\/static\//g' {} \;
find build_webpack/index.html -type f -exec sed -i 's/\/favicon.ico/.\/favicon.ico/g' {} \;

echo "Deploying to IPFS..."
hash_row=$(ipfs add -r build_webpack | grep build_webpack | tail -1)
hash_row_arr=($hash_row)
echo "Deploy successful. Content available at https://gateway.ipfs.io/ipfs/${hash_row_arr[1]}"
