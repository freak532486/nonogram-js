import Fastify from 'fastify'
import app from './app'
import config from '../config/config'
import * as fs from "fs"
import { CONFIG_PATH } from './constants'
import { getNumberSetting, getStringSetting } from '../config/impl/config-access';

async function start() {
    /* Read config for port and certificates */
    const conf = config.readConfig(CONFIG_PATH);

    let port = 3000;
    let certKey: Buffer | undefined = undefined;
    let cert: Buffer | undefined = undefined;

    if (conf) {
        port = getNumberSetting(conf, "port") || 3000;

        const certKeyPath = getStringSetting(conf, "certificate_keyfile");
        const certPath = getStringSetting(conf, "certificate_certfile");
        if (certKeyPath && certPath) {
            certKey = fs.readFileSync(certKeyPath);
            cert = fs.readFileSync(certPath);
        }
    }

    /* Start server */
    const fastify = Fastify({
        https: cert ? { cert: cert, key: certKey } : null,
        logger: {
            level: "info",
            transport: {
                targets: [
                    {
                        target: "pino/file",
                        options: { destination: "server.log" }
                    },
                    {
                        target: "pino-pretty"
                    }
                ]
            }
        }
    });
    await fastify.register(app);

    await fastify.listen({
        port: port,
        host: "0.0.0.0"
    });
}

start()