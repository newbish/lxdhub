import { Interfaces, LogType } from '@lxdhub/common';
import { IDatabaseSettings } from '@lxdhub/db';
import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsString } from 'class-validator';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './exception';
import { LogService } from './log';
import { RequestLoggerInterceptor } from './log/request-logger.interceptor';
import { Application } from 'express';
import * as Chalk from 'chalk';
import * as express from 'express';
import * as cors from 'cors';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { NestExpressApplication, ExpressAdapter } from '@nestjs/platform-express';

/**
 * The LXDHub API settings
 */
export class LXDHubAPISettings {
    @IsInt()
    @Type(() => Number)
    port?: number = 3000;
    @IsString()
    @Type(() => String)
    hostUrl?: string = '0.0.0.0';
    database: IDatabaseSettings;
    lxd?: Interfaces.ILXDRemoteAuthentication;
    logLevel?: LogType = 'silly';
    docUrl: string = '/api/v1/doc';
    upload: boolean = false;
}

/**
 * The LXDHub API is the interface for the
 * LXDHub Web user interface.
 */
export class LXDHubAPI implements Interfaces.ILXDHubHttpService {
    private app: NestExpressApplication;
    private logger: LogService;
    private url: string;

    constructor(private settings: LXDHubAPISettings, private server?: Application) {
        this.logger = new LogService('LXDHubAPI', settings.logLevel);
        this.url = `http://${this.settings.hostUrl}:${this.settings.port}`;
    }

    /**
     * Conigurates Swagger for Nest
     */
    private setupSwagger() {
        const options = new DocumentBuilder()
            .setTitle('LXDHub API')
            .setDescription('Display, search and copy LXD images using a web interface.')
            .setVersion('1.0')
            .build();

        const document = SwaggerModule.createDocument(this.app, options);
        SwaggerModule.setup(this.settings.docUrl || '/api/v1/doc', this.app, document);
    }

    /**
     * Creates the Nest App
     */
    private async createNestApp() {
        const nestSettings = { logger: this.logger };

        if (!this.server) {
            this.server = express();
        }

        this.app = await NestFactory.create<NestExpressApplication>(
            AppModule.forRoot(this.settings),
            new ExpressAdapter(this.server),
            nestSettings
        );

        this.app.useWebSocketAdapter(new IoAdapter(this.app.getHttpServer()));
    }

    /**
     * Setup the middleware for LXDHub API
     */
    private setupMiddleware() {

        // this.app.setGlobalPrefix('/api/v1');
        // Global execution handler
        this.app.useGlobalFilters(new HttpExceptionFilter());
        // Global request logger
        this.app.useGlobalInterceptors(new RequestLoggerInterceptor());

        // In development, allow any origin to access the website
        if (process.env.NODE_ENV !== 'production') {
            this.app.use(cors({
                origin: true,
                credentials: true
            }));
        }

        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, DEVICE_ID, SSO_TOKEN');

            next();
        });
    }

    /**
     * Bootstraps the LXDHub API and returns the
     * Express instance
     */
    async bootstrap(): Promise<Application> {
        await this.createNestApp();
        this.setupSwagger();
        this.setupMiddleware();

        return this.server;
    }

    /**
     * Bootstraps & starts LXDHub API with the given conifgurations
     */
    async run() {
        this.logger.log('Bootstraping application');
        try {
            await this.bootstrap();
        }
        catch (err) {
            err = err as Error;
            this.logger.error(`An error occured while bootstraping the application`);
            this.logger.error(err.message);
        }

        // Starts listening on the given port and host url
        await this.app.listen(this.settings.port, this.settings.hostUrl);
        this.logger.log(`Open on ${Chalk.default.blue(this.url)}`);
    }
}
