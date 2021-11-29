const csv = require("csv-parser");
const path = require("path");
const fs = require("fs");
const chalk = require("chalk");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const { resolve } = require("path");

const rl = require("readline").createInterface({
	input: process.stdin,
	output: process.stdout,
	terminal: false,
});

const funzioni = [
	"Crea conto corrente",
	"Mostra saldo conto corrente",
	"Mostra lista movimenti conto corrente",
	"Effettua un versamento sul conto corrente",
	"Effettua un prelievo sul conto corrente",
	"Esci da SmartBK",
];

const readFile = async fileName => {
	const results = [];

	return new Promise((resolve, reject) => {
		fs.createReadStream(`${fileName}`)
			.pipe(csv({ separator: ";" }))
			.on("data", data => results.push(data))
			.on("end", () => {
				resolve(results);
			});
	});
};

const writeFile = async (fileName, headers, content, append = true) => {
	const file = createCsvWriter({
		append: append,
		fieldDelimiter: ";",
		path: `./${fileName}`,
		header: headers,
	});

	return file.writeRecords(content);
};

const chooseAction = async () => {
	let statusCode = 0;

	do {
		console.log("Choose what you want to do: \n");

		for (let i = 0; i < funzioni.length; i++) {
			console.log("   ", `${i + 1}.`, funzioni[i]);
		}

		statusCode = await new Promise((resolve, reject) => {
			rl.question("\nLa tua scelta: ", async scelta => {
				switch (scelta) {
					case "1":
						await creaConto();
						break;
					case "2":
						await mostraSaldo();
						break;
					case "3":
						await mostraMovimenti();
						break;
					case "4":
						await creaMovimento();
						break;
					case "5":
						await creaMovimento();
						break;
					case "6":
						resolve(1);
				}

				resolve(0);
			});
		});
	} while (statusCode === 0);
};

const getIdConto = async () => {
	const results = [];

	return new Promise((resolve, reject) => {
		fs.createReadStream("Anagrafica_conti.csv")
			.pipe(csv({ separator: ";" }))
			.on("data", data => results.push(data))
			.on("end", () => {
				resolve(results.length + 1);
			});
	});
};

const aggiornaSaldo = async (idConto, importoDaAggiungere) => {
	const headers = [
		{ id: "IDCONTO", title: "IDCONTO" },
		{ id: "IMPORTO", title: "IMPORTO" },
		{ id: "TIMESTAMP", title: "TIMESTAMP" },
	];

	const saldiAggiornati = await readFile("Saldo_conti.csv").then(
		saldiUtenti => {
			saldi = saldiUtenti.map(e => {
				console.log(Number(e.IDCONTO) === Number(idConto));
				return Number(e.IDCONTO) === Number(idConto)
					? {
							IDCONTO: idConto.toString(),
							IMPORTO: Number(e.IMPORTO)
								? Number(e.IMPORTO) +
								  Number(importoDaAggiungere)
								: Number(importoDaAggiungere),
							TIMESTAMP: `ORA: ${new Date().getHours()}:${new Date().getMinutes()} - DATA: ${new Date().getDate()}/${
								new Date().getMonth() + 1
							}/${new Date().getFullYear()}`,
					  }
					: e;
			});

			writeFile("Saldo_conti.csv", headers, saldi, false);
		}
	);
};

const creaMovimento = async (idConto = null) => {
	idConto =
		idConto === null
			? await new Promise((resolve, reject) => {
					rl.question("Inserisci il tuo id: ", id => resolve(id));
			  })
			: idConto;

	const headers = [
		{ id: "idConto", title: "IDCONTO" },
		{ id: "importo", title: "IMPORTO" },
		{ id: "timestamp", title: "TIMESTAMP" },
	];

	const importo = await new Promise((resolve, reject) => {
		rl.question("Inserisci importo: ", importo => {
			console.log(
				Number(importo) > 0
					? `Versati ${chalk.greenBright(importo)}€ sul conto`
					: `Prelevati ${chalk.redBright(importo)}€ dal conto`
			);

			resolve(importo);
		});
	});

	const movimento = [
		{
			idConto: idConto,
			importo: importo,
			timestamp: `ORA: ${new Date().getHours()}:${new Date().getMinutes()} - DATA: ${new Date().getDate()}/${
				new Date().getMonth() + 1
			}/${new Date().getFullYear()}`,
		},
	];

	await writeFile("SaldoMovimenti_conti.csv", headers, movimento).then(() =>
		console.log("Lista movimenti aggiornata con successo")
	);

	if (idConto)
		await aggiornaSaldo(idConto, importo).then(() =>
			console.log("Saldo aggiornato con successo")
		);

	return new Promise((resolve, reject) => resolve(importo));
};

const creaConto = async () => {
	const headers = [
		{ id: "nome", title: "NOME" },
		{ id: "cognome", title: "COGNOME" },
		{ id: "idConto", title: "IDCONTO" },
	];

	const headers1 = [
		{ id: "IDCONTO", title: "IDCONTO" },
		{ id: "IMPORTO", title: "IMPORTO" },
		{ id: "TIMESTAMP", title: "TIMESTAMP" },
	];

	const nome = await new Promise((resolve, reject) => {
		rl.question("Inserisci il tuo nome: ", nome => resolve(nome));
	});

	const cognome = await new Promise((resolve, reject) => {
		rl.question("Inserisci il tuo cognome: ", cognome => resolve(cognome));
	});

	const idConto = await getIdConto();

	const conto = [{ nome: nome, cognome: cognome, idConto: idConto }];

	await writeFile("Anagrafica_conti.csv", headers, conto);

	console.log(
		"\nBenvenuto, per completare la creazione del conto, è necessario depositare una somma iniziale\n"
	);

	const importo = await creaMovimento(idConto);

	await writeFile("Saldo_conti.csv", headers1, [
		{
			IDCONTO: idConto,
			IMPORTO: Number(importo),
			TIMESTAMP: `ORA: ${new Date().getHours()}:${new Date().getMinutes()} - DATA: ${new Date().getDate()}/${
				new Date().getMonth() + 1
			}/${new Date().getFullYear()}`,
		},
	]);
};

const mostraSaldo = async () => {
	const idConto = await new Promise((resolve, reject) => {
		rl.question("Inserisci il tuo id: ", id => resolve(id));
	});

	let saldi = await readFile("Saldo_conti.csv");

	saldi = saldi.filter(saldi => saldi.IDCONTO === idConto)[0];

	const stringa = `Il tuo saldo alle ore ${new Date().getHours()}:${new Date().getMinutes()} del giorno ${new Date().getDate()}/${
		new Date().getMonth() + 1
	}/${new Date().getFullYear()} è di ${saldi.IMPORTO}€`;

	console.log(stringa);
};

const mostraMovimenti = async () => {
	const idConto = await new Promise((resolve, reject) => {
		rl.question("Inserisci il tuo id: ", id => resolve(id));
	});

	let movimenti = await readFile("SaldoMovimenti_conti.csv");

	movimenti = movimenti
		.filter(movimento => movimento.IDCONTO === idConto)
		.forEach(movimento => {
			console.log(movimento.IMPORTO, movimento.TIMESTAMP);
		});
};

console.log(
	chalk.greenBright("Welcome to SmartBK, your personal online bank \n")
);

chooseAction();
