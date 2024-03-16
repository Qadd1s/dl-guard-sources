import eel
import json
import threading
import serial
import requests


@eel.expose
def get_settings():
	with open('./config.json') as f:
		data = json.load(f)
	return data


def json_write(data):
	with open('./config.json', 'w') as f:
		json.dump(data, f)


@eel.expose
def change_path(newPath):
	data = get_settings()
	data[1]["path"] = newPath
	json_write(data)
	eel.sendFeedback(
		"settings", "<em>Успешно!<br>Адрес отправки данных успешно изменён!</em>")
	eel.getReaders()

@eel.expose
def change_stat(newPath):
	data = get_settings()
	data[1]["stat"] = newPath
	json_write(data)
	eel.sendFeedback("settings", "<em>Успешно!<br>Адрес отправки статистики успешно изменён!</em>")
	eel.getReaders()


@eel.expose
def change_name(device, newName):
	data = get_settings()
	data[0][device]["name"] = newName
	json_write(data)
	eel.sendFeedback(
		"settings", "<em>Успешно!<br>Название устройства успешно изменено!</em>")
	eel.getReaders()


@eel.expose
def change_port(device, newPort):
	data = get_settings()
	data[0][device]["port"] = newPort
	json_write(data)
	eel.sendFeedback(
		"settings", "<em>Успешно!<br>Порт устройства успешно изменён!</em>")
	eel.getReaders()


@eel.expose
def add_device(device):
	data = get_settings()
	data[0].append(device)
	json_write(data)
	eel.sendFeedback(
		"new-device", "<em>Успешно!<br>Новое устройство сохранено!</em>")
	eel.getReaders()


@eel.expose
def remove_device(device):
	data = get_settings()
	del data[0][device]
	json_write(data)
	eel.sendFeedback(
		"settings", "<em>Успешно!<br>Устройсто успешно удалено!</em>")
	eel.getReaders()


@eel.expose
def change_state(device):
	data = get_settings()
	new_state = not data[0][device]["isWorking"]
	data[0][device]["isWorking"] = new_state
	json_write(data)

	if new_state:
		start_device(device)
	else:
		stop_device(device)

	eel.changeState(device)


@eel.expose
def render_devices():
	devices = get_settings()[0]
	for i in range(len(devices)):
		if devices[i]["isWorking"]:
			start_device(i)
		else:
			stop_device(i)


@eel.expose
def stop_all():
	devices = get_settings()[0]
	for i in range(len(devices)):
		if devices[i]["isWorking"]:
			change_state(i)

#################################

device_threads = {}


def start_device(device):
	if device not in device_threads and get_settings()[0][device]["isWorking"]:
		thread = threading.Thread(target=device_communication, args=(device,))
		thread.start()
		device_threads["device"] = thread


def stop_device(device):
	if device in device_threads:
		del device_threads["device"]


def device_communication(device):
	ser = serial.Serial(get_settings()[0][device]["port"], 115200, timeout=1)

	while get_settings()[0][device]["isWorking"]:
		try:
			line = ser.readline().decode().strip()
			if line:
				ser.close()

				response = requests.post(
					get_settings()[1]["path"],
					json={'uid': str(line)}
				)

				if response.status_code == 200:
					response = response.content.decode()

					if response == "true":
						eel.updateOutput(get_settings()[0][device]["port"],
										"<em>Доступ разрешён</em>")
					elif response == "false":
						eel.updateOutput(get_settings()[0][device]["port"],
											"<i>Доступ запрещён</i>")
					else:
						eel.showError("<em>Внимание!<br>Ошибка в работе сервера!</em>")
						requests.get(get_settings()[1]["stat"], json={"type": "server"})
						
					eel.sleep(2.0)
					ser.open()
				else:
					eel.showError("<em>Внимание!<br>Ошибка в работе сервера!</em>")
		except serial.SerialException or serial.PortNotOpenError:
			eel.showError("<em>Внимание!<br>Ошибка в работе устройства или связанного с ней модуля!</em>")
			requests.get(get_settings()[1]["stat"], json={"type": "device"})
			change_state(device)
		except requests.RequestException or requests.ConnectionError:
			eel.showError("<em>Внимание!<br>Ошибка в отправке запроса на сервер!</em>")
			requests.get(get_settings()[1]["stat"], json={"type": "program"})
			change_state(device)
	ser.close()


eel.init("web")
eel.start("index.html", size=(1200, 850))
