import { Interfaces } from '@lxdhub/common';
import { Command, command, metadata, option, Options } from 'clime';
import { File } from 'clime/bld/castable';
import * as fs from 'fs-extra';
import * as YAML from 'js-yaml';

import { LXDHubDbSync } from '../../..';

export class StartOptions extends Options {
  @option({
    description: 'The name of the database to connect to. Default is lxdhub',
    type: String
  })
  databaseName = 'lxdhub';

  @option({
    description: 'The host of the database to connect to. Default is localhost',
    type: String
  })
  databaseHost: string = 'localhost';

  @option({
    description: 'The database password for the given user. Default is lxdhub',
    type: String
  })
  databasePassword: string = 'lxdhub';

  @option({
    description: 'The database port to connect to. Default is 5432',
    type: Number
  })
  databasePort: number = 5432;

  @option({
    description: 'The database username. Default is lxdhub',
    type: String
  })
  databaseUsername: string = 'lxdhub';

  @option({
    description: 'The LXD certificate for the remote',
    type: File,
    default: `${process.env.HOME}/.config/lxc/client.crt`
  })
  cert: File;

  @option({
    description: 'The LXC key for the remote',
    type: File,
    default: `${process.env.HOME}/.config/lxc/client.key`
  })
  key: File;

  @option({
    description: 'The lxdhub.yml file with the configured remotes',
    required: true,
    type: File,
    flag: 'c'
  })
  config: File;

  @option({
    description: 'Whether it should enforce the database synchronization run',
    type: Boolean,
    default: false
  })
  force: boolean;
}

@command({
  description: 'Start the lxdhub database synchronization'
})
export default class extends Command {
  @metadata
  async execute(options: StartOptions) {
    const database = {
      database: options.databaseName || 'lxdhub',
      host: options.databaseHost || 'localhost',
      password: options.databasePassword || 'lxdhub',
      port: options.databasePort || 5432,
      username: options.databaseUsername || 'lxdhub'
    };

    const lxd = {
      cert: fs.readFile(options.cert.fullName),
      key: fs.readFileSync(options.key.fullName)
    };

    // Read the config file
    await fs
      .readFile(options.config.fullName, 'utf8')
      // Convert from YAML to JSON
      .then(content => YAML.safeLoad(content))
      // Create the database sync instance
      .then(
        (lxdhubConfig: Interfaces.ILXDHubConfig) =>
          new LXDHubDbSync({
            lxd,
            database,
            lxdhubConfig,
            force: options.force
          })
      )
      // Run the database sync script
      .then(dbSync => dbSync.run());
  }
}
