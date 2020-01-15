import { Command, command, metadata, option, Options } from 'clime';

import { LXDHubAPI, LXDHubAPISettings } from '../../..';
import * as fs from 'fs';
import { LogType } from '@lxdhub/common';

export class StartOptions extends Options {
    @option({
        flag: 'p',
        description: 'Port on which lxdhub-api should listen. Default is 3000',
    })
    port: number = 3000;

    @option({
        flag: 'h',
        description: 'Hostname of lxdhub-api. Default is 0.0.0.0'
    })
    host: string = '0.0.0.0';

    @option({
        description: 'The name of the database to connect to. Default is lxdhub'
    })
    databaseName = 'lxdhub';

    @option({
        description: 'The host of the database to connect to. Default is localhost'
    })
    databaseHost: string = 'localhost';

    @option({
        description: 'The database password for the given user. Default is lxdhub'
    })
    databasePassword: string = 'lxdhub';

    @option({
        description: 'The database port to connect to. Default is 5432'
    })
    databasePort: number = 5432;

    @option({
        description: 'The database username. Default is lxdhub'
    })
    databaseUsername: string = 'lxdhub';

    @option({
        description: 'The LXD certificate for the remote'
    })
    cert: string = `${process.env.HOME}/.config/lxc/client.crt`;

    @option({
        description: 'The LXC key for the remote'
    })
    key: string = `${process.env.HOME}/.config/lxc/client.key`;

    @option({
        description: 'The log level'
    })
    logLevel: LogType = 'info';

    @option({
        description: 'The url to the swagger documentation'
    })
    docUrl: string = '/api/v1/doc';

    @option({
        description: 'If the image upload is enabled'
    })
    upload: boolean = false;
}

@command({
    description: 'Start the lxdhub api'
})
export default class extends Command {
    @metadata
    async execute(
        options: StartOptions
    ) {
        const apiOptions: LXDHubAPISettings = {
            port: options.port ?? 3000,
            hostUrl: options.host ?? '0.0.0.0',
            logLevel: options.logLevel ?? 'info',
            docUrl: options.docUrl ?? '/api/v1/doc',
            database: {
                database: options.databaseName ?? 'lxdhub',
                host: options.databaseHost ?? 'localhost',
                password: options.databasePassword ?? 'lxdhub',
                port: options.databasePort ?? 5432,
                username: options.databaseUsername ?? 'lxdhub'
            },
            lxd: {
                // @ts-ignore
                cert: fs.readFileSync(options.cert ?? `${process.env.HOME}/.config/lxc/client.crt`),
                // @ts-ignore
                key: fs.readFileSync(options.key ?? `${process.env.HOME}/.config/lxc/client.key`)
            },
            upload: options.upload ?? false
        };

        await new LXDHubAPI(apiOptions).run();
    }
}
