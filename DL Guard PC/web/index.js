const rlNode = document.getElementById("readers");
const rlcNode = document.getElementById("changeReadersList");
const pathInput = document.getElementById("pathInput");

eel.expose(getReaders);
eel.expose(sendFeedback);
eel.expose(changeState);
eel.expose(updateOutput);
eel.expose(sendError);

let readersList = [];
let serverPath;

const renderDevices = () => {
	rlNode.innerHTML = "";
	rlcNode.innerHTML = "";

	if (readersList.length == 0) {
		rlNode.innerHTML = `<h5 class="empty">
			Список устройств пуст, но вы можете <span onclick="toggleModal('new-device')">добавить</span> устройства
		</h5>`;
		rlNode.classList.remove("rl-overflow");
		rlcNode.innerHTML = `<h5 class="empty">
			Список устройств пуст, но вы можете <span onclick="toggleModal('settings'); toggleModal('new-device')">добавить</span> устройства
		</h5>`;
		rlcNode.classList.remove("rlc-overflow");
	} else {
		for (let i = 0; i < readersList.length; i++) {
			let device = readersList[i];

			rlNode.classList.add("rl-overflow");
			rlNode.innerHTML += `
					<li class="reader">
						<svg>
							<use xlink:href="#nfc-logo"></use>
						</svg>
						<h2>${device.name == "" ? device.port : device.name}</h2>
						<span class="reader__state">${
							device.isWorking
								? "Считыватель <em>работает</em>"
								: "Считыватель <i>не работает</i>"
						}</span>
						<p>Вывод:<br><span id="do-${i}" class="reader__output">---</span></p>
						<hr>
						${
							device.isWorking
								? `<button onclick="eel.change_state(${i})()">Остановить</button>`
								: `<button onclick="eel.change_state(${i})()">Запустить</button>`
						}
					</li>
					`;

			rlcNode.classList.add("rlc-overflow");
			rlcNode.innerHTML += `
			<div class="reader-inf">
				<div class="wrapper">
					<input id="portInputChange-${i}" value="${device.port}" placeholder="${
				device.port
			}" type="text">
					<button onclick="changePort(${i})">Изменить порт</button>
				</div>
				<div class="wrapper">
					<input id="nameInputChange-${i}" ${
				device.name == ""
					? 'value="" placeholder="Название отсутствует"'
					: `value="${device.name}" placeholder="${device.name}"`
			} type="text">
					<button onclick="changeName(${i})">Изменить название</button>
				</div>
				<button onclick="eel.remove_device(${i})()" class="remove-btn">Удалить</button>
			</div>
			`;
		}
	}
};

const toggleModal = (window) => {
	if (window == "settings") {
		document.getElementById("settings").classList.toggle("modal--active");
		document
			.getElementById("settings-content")
			.classList.toggle("modal__content--active");
	} else {
		document.getElementById("new-device").classList.toggle("modal--active");
		document
			.getElementById("new-device-content")
			.classList.toggle("modal__content--active");
	}
};

const changePath = () => {
	if (pathInput.value.trim() == "") {
		sendFeedback(
			"settings",
			"<i>Ошибка!<br>Поле адреса отправки не может быть пустым!</i>"
		);
	} else if (pathInput.value.trim() == serverPath) {
		return;
	} else {
		eel.change_path(pathInput.value.trim())();
		pathInput.value = "";
	}
};

const changeName = (id) => {
	const newName = document.getElementById(`nameInputChange-${id}`).value.trim();
	eel.change_name(id, newName)();
};

const changePort = (id) => {
	const newPort = document.getElementById(`portInputChange-${id}`).value.trim();

	if (newPort == "") {
		sendFeedback(
			"settings",
			"<i>Ошибка!<br>Поле COM порта должно быть заполнено!</i>"
		);
	} else if (readersList[id].port == newPort) {
		return;
	} else if (readersList.find((obj) => obj.port == newPort)) {
		sendFeedback(
			"settings",
			"<i>Ошибка!<br>Поле COM порта должно быть уникально!</i>"
		);
	} else {
		eel.change_port(id, newPort)();
	}
};

const addNewDevice = () => {
	const port = document.getElementById("portInput");
	const name = document.getElementById("nameInput");

	if (port.value.trim() == "") {
		sendFeedback(
			"new-device",
			"<i>Ошибка!<br>Поле COM порта должно быть заполнено!</i>"
		);
	} else if (readersList.find((obj) => obj.port == port.value.trim())) {
		sendFeedback(
			"new-device",
			"<i>Ошибка!<br>Поле COM порта должно быть уникально!</i>"
		);
	} else {
		const device = {
			port: port.value.trim(),
			name: name.value.trim(),
			isWorking: false,
		};
		eel.add_device(device)();

		port.value = "";
		name.value = "";
	}
};

function changeState(id) {
	readersList[id].isWorking = !readersList[id].isWorking;
	renderDevices();
}

function updateOutput(port, text) {
	const id = readersList.findIndex((obj) => obj.port == port);
	const outputNode = document.getElementById(`do-${id}`);
	outputNode.innerHTML = text;
	setTimeout(() => {
		outputNode.innerHTML = "---";
	}, 3000);
}

function sendFeedback(type, text) {
	let feedBack;

	if (type == "settings") {
		feedBack = document.getElementById("feedback-stg");
	} else {
		feedBack = document.getElementById("feedback-nd");
	}

	feedBack.innerHTML = text;
	feedBack.classList.remove("hidden");
	setTimeout(() => {
		feedBack.classList.add("hidden");
		setTimeout(() => {
			feedBack.innerHTML = "";
		}, 400);
	}, 2500);
}

function sendError(text) {
	const outputError = document.getElementsByClassName("errors-output");
	outputError.innerHTML = text;
	outputError.classList.remove("hidden");
	setTimeout(() => {
		outputError.classList.add("hidden");
		setTimeout(() => {
			outputError.innerHTML = "";
		}, 400);
	}, 2500);
}

function getReaders() {
	eel.get_settings()(function (data) {
		readersList = data[0];
		serverPath = data[1].path;
		pathInput.placeholder = serverPath;
		renderDevices();
	});
	eel.render_devices()();
}

getReaders();

window.onbeforeunload = () => {
	eel.stop_all()();
};
