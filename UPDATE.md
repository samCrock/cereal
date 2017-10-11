### Example (windows)
*	Edit code
*	Commit & push	
*	Apply patch
```
$ npm version patch -m "Upgrade to %s"
```
*	Generate installer
```
$ npm run dist-w
```
*	Copy 'cereal-w-release/Cereal Setup x.x.x.exe' to an external folder
*	Delete 'dist' folder
*	Switch to w-release branch
```
$ git checkout w-release
```
*	Paste previously saved installer
*	Commit & push

