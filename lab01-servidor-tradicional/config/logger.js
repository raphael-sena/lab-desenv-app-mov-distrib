// logger.js
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, errors, json } = format;

const logFormat = printf(({ level, message, timestamp, ...meta }) => {
    return JSON.stringify({
        timestamp,
        level,
        message,
        ...meta
    });
});

const logger = createLogger({
    level: 'info',
    format: combine(
        errors({ stack: true }),
        timestamp(),
        json({ space: 2 }),
        logFormat
    ),
    transports: [
        new transports.Console()
    ]
});

module.exports = logger;
