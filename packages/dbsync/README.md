<h2 align="center">
    <img src="https://i.imgur.com/RGCZZjl.png" alt="LXDHUB DBSYNC Logo" width="500" />
</h2>

 <p align="center">Display, search and copy <a href="https://linuxcontainers.org/lxd/" target="blank">LXD</a> images using a web interface. </p>

 <p align="center">
  <a href="https://gitter.im/Roche/lxdhub?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=body_badge"><img src="https://badges.gitter.im/Roche/lxdhub.svg" alt="Gitter" /></a>
  <img src="https://circleci.com/gh/Roche/lxdhub.png?circle-token=f41c49274b61c18d8a5867ab9d49b9f27a2227aa&style=shield" alt="Circle CI Status">
  <a href="https://www.npmjs.com/package/@lxdhub/dbsync"><img src="https://badge.fury.io/js/%40lxdhub%2Fdbsync.svg"   alt="npm version" height="18"></a>
  <a href="https://www.npmjs.com/package/@lxdhub/dbsync">
    <img src="https://img.shields.io/npm/dt/@lxdhub%2Fdbsync.svg" alt="npm downloads" height="18">
  </a>
 </p>

## Database

LXDHub DBSync uses a PostgreSQL database to store its data.
You must set up a PostgreSQL on your local machine or inside a docker container

### Using Docker

```bash
docker run -p 5432:5432 \
           -e POSTGRES_USER=lxdhub \
           -e POSTGRES_DB=lxdhub \
           -e POSTGRES_PASSWORD=lxdhub \
           -v db:/var/lib/postgresql/data \
           -d --name db postgres:10.2
```

## NodeJS

### CLI

```bash
npm install -g @lxdhub/dbsync

# Run locally
lxdhub-dbsync start -c ./lxdhub.yml
```

### Programmatically

```bash
npm install -s @lxdhub/dbsync
# run the dbsync
/usr/bin/lxdhub-dbsync start --config /path/to/lxdhub.yml
```

Example usage in NodeJS

```javascript
const { LXDHubDbSync } = require('@lxdhub/dbsync');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const certPath = path.join(ROOT, 'certificates/client.crt');
const keyPath = path.join(ROOT, 'certificates/client.key');
const lxdhubConfig = path.join(ROOT, 'lxdhub.yml');

LXDHubDbSync.run({
    lxdhubConfig,
    lxd: {
        cert: fs.readFileSync(certPath),
        key: fs.readFileSync(keyPath)
    },
    database: {
        host: 'localhost',
        port: 5432,
        username: 'lxdhub',
        password: 'lxdhub',
        database: 'lxdhub'
    }
});

```

## Docker

LXDHub supports Docker. You can pull the latest version using the `brunnel6/lxdhub-dbsync:latest` tag
or a specific version e.g. `brunnel6/lxdhub-dbsync:1.0.0`

```bash
docker pull brunnel6/lxdhub-dbsync:latest
docker run -v "$(pwd)/certificates:/var/lib/lxdhub/certificates" \
           -v "$(pwd)/lxdhub.yml:/var/lib/lxdhub/lxdhub.yml" \
           -p 3000:3000 \
           -e POSTGRES_HOST=postgres \
           --link db:postgres \
           brunnel6/lxdhub-dbsync:latest
```
