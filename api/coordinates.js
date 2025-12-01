const mongoose = require('mongoose');

const uri = "mongodb+srv://nesyasr_db:Kyf6RlCfpPL7xUQW@cluster0.ugclw96.mongodb.net/WorldMapsDB?retryWrites=true&w=majority";

const PinSchema = new mongoose.Schema({
	lat: { type: Number, required: true },
	lng: { type: Number, required: true },
	name: { type: String, required: true },
	description: { type: String, default: 'No Description' },
	denahUrl: { type: String, default: null },
	createdAt: { type: Date, default: Date.now },
}, { collection: 'pins' });

const Pin = mongoose.models.Pin || mongoose.model('Pin', PinSchema);

async function connectToDatabase() {
	if (mongoose.connection.readyState >= 1) {
		console.log("LOG: Already connected.");
		return;
	}

	try {
		console.log("LOG: Attempting to connect to MongoDB with Mongoose...");
		await mongoose.connect(uri, {
		});
		console.log("LOG: Successfully connected to MongoDB.");
	} catch (error) {
		console.error("LOG ERROR: Failed to connect to MongoDB!", error);
		throw new Error("Database connection failed.");
	}
}

module.exports = async (req, res) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

	if (req.method === 'OPTIONS') {
		return res.status(200).end();
	}

	try {
		await connectToDatabase();

		if (req.method === 'POST') {
			const { lat, lng, name, denahUrl } = req.body;

			if (!lat || !lng || !name) {
				console.warn("LOG WARNING: POST request missing lat/lng/name.");
				return res.status(400).json({ success: false, message: "Missing required fields." });
			}

			const newPin = new Pin({
				lat: parseFloat(lat),
				lng: parseFloat(lng),
				name: name,
				description: req.body.description || 'No Description',
				denahUrl: denahUrl || null,
			});

			const result = await newPin.save();

			console.log(`LOG: New pin stored successfully. Name: ${name}`);
			return res.status(201).json({ success: true, message: "Pin saved.", id: result._id });

		} else if (req.method === 'GET') {
			const points = await Pin.find({});

			console.log(`LOG: Retrieved ${points.length} pins from database.`);
			return res.status(200).json(points);
		} else {
			console.warn(`LOG WARNING: Method ${req.method} not allowed.`);
			return res.status(405).send('Method Not Allowed');
		}

	} catch (error) {
		console.error("LOG ERROR: General API processing error.", error);
		return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
	}
};