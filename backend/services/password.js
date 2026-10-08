import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);

export const hashPassword = async (password) => {
	const salt = randomBytes(16).toString('hex');
	const derivedKey = await scrypt(password, salt, 64);

	return `scrypt$${salt}$${Buffer.from(derivedKey).toString('hex')}`;
};

export const verifyPassword = async (password, passwordHash) => {
	if (typeof passwordHash !== 'string') {
		return false;
	}

	const [algorithm, salt, keyHex] = passwordHash.split('$');
	if (algorithm !== 'scrypt' || !salt || !/^[\da-f]{128}$/i.test(keyHex ?? '')) {
		return false;
	}

	const storedKey = Buffer.from(keyHex, 'hex');
	const derivedKey = Buffer.from(await scrypt(password, salt, storedKey.length));
	return timingSafeEqual(derivedKey, storedKey);
};