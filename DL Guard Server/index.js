// Подключение express и создание сервера
const express = require("express");
const app = express();
const port = 4444;

// Добавляем возможность POST-запросов
app.use(express.urlencoded({ extended: true }));

// Подключение к БД
const mongoose = require("mongoose");
mongoose.connect("адрес базы данных");

// Создание схем
const studentsSchema = new mongoose.Schema(
	{
		firstname: {
			required: true,
			type: String,
		},
		surname: {
			required: true,
			type: String,
		},
		uid: {
			unique: true,
			required: true,
			type: String,
		},
		login: {
			unique: true,
			required: true,
			type: String,
		},
		password: {
			required: true,
			type: String,
		},
		isStudying: {
			required: true,
			type: Boolean,
		},
	},
	{
		timestamps: true,
	}
);

// Соединяем схему с коллекцией
const Student = mongoose.model("students", studentsSchema);

// Запуск сервера
app.listen(port, function () {
	console.log(`Сервер запущен по адресу: http://localhost:${port}/`);
});

// Сервисная часть
app.get("/check-uid", async function (req, res) {
	const uid = req.query.uid;

	try {
		let student = await Student.findOne({ uid: uid });

		if (student) {
			if (student.isStudying) {
				res.send("true");
			} else {
				res.send("false");
			}
		} else {
			res.send("false");
		}
	} catch (error) {
		res.send("error");
		console.log(error);
	}
});
