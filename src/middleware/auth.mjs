import {config} from '../config/env-loader.mjs';

function authenticate(req, res, next) {
	const apiKey = req.headers['x-api-key'];
	if (!apiKey || apiKey !== config.apiKey) {
		return res.status(401).json({ error: 'Não autorizado' });
	}

	next();
}

export default authenticate;
