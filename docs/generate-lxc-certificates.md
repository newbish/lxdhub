# Certificates

Certificates are required for the authentication your LXD server.
In order to access or alter data, LXD-Hub needs these certificates.

## Generate

If you have not already generated any certificate, you can do that,
by typing any lxc command. LXC should then print a message, that the client
certificate is being generated. If this does not occur, you
probably already generated a certificate, which is fine.

```bash
# LXC only generates the certificates when connecting to a remove private LXD instance over https
lxc remote add https://us.images.linuxcontainers.org:8443
lxc list
```

## Copy

You now need to copy the certificates into this repository.

```bash
cd path/to/this/repo
cp -rf ~/.config/lxc/client* certificates
```

The files `client.crt` and `client.key` should now appear in the folder `certificates`.

```
➜ ls certificates
client.crt  client.key
```

## Without Copy

In case you have the certificate somewhere else stored, and do not
want to copy into this repository, you can use the environment variables
`LXD_CRT` and `LXD_KEY`.

Edit the `docker-compose.yml` file:

```bash
vi docker-compose.yml
/LXD_
```

Change the the path for the LXD_KEY and LXD_CERT:

```YAML
- LXD_CRT=certificates/client.crt
- LXD_KEY=certificates/client.key
```
