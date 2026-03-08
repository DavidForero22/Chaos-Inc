/**
 * Muestra un mensaje en consola con un timestamp detallado [HH:mm:ss.SSS]
 */
export const logWithTime = (message: string, data: any = null) => {
	const now = new Date();
	const time = now.toTimeString().split(" ")[0]; 
	const ms = String(now.getMilliseconds()).padStart(3, "0");

	const timestamp = `[${time}.${ms}]`;

	if (data) {
		console.log(`${timestamp} - ${message}`, data);
	} else {
		console.log(`${timestamp} - ${message}`);
	}
};
