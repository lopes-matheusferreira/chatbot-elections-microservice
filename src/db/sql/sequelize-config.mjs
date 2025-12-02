import dotenv from 'dotenv';
dotenv.config();
import { Sequelize } from 'sequelize';
import {config} from '../../config/env-loader.mjs';

export const sequelize = new Sequelize(
	config.database.name,
	config.database.user,
	config.database.password,
	{
		host: config.database.host,
		dialect: 'mysql',
		logging: false,
		pool: {
			max: 10,
			min: 2,
			idle: 20000
		}
	}
);
