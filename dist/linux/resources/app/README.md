Cereal
===========

Stream & download your favorite shows

---

## Install
```
$ npm install
```

## Start
```
$ npm run start
```

## Build
```
$ npm install -g electron-packager

```

### Linux (Ubuntu)
```
$ electron-packager . --overwrite --platform=linux --arch=x64 --prune=true --out=release-builds --ignore='library'
```

### Windows
```
$ electron-packager . --overwrite --asar=true --platform=win32 --arch=ia32 --icon=assets/icons/win/icon.ico --prune=true --out=release-builds --version-string.CompanyName=CrockWorks --version-string.FileDescription=CrockWorks --version-string.ProductName=\"Cereal\"
```

### MacOS
```
$ electron-packager . --overwrite --platform=darwin --arch=x64 --icon=assets/icons/mac/icon.icns --prune=true --out=release-builds
```

