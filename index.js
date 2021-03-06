const csv = require("csv-parser");
const path = require("path");
const fs = require("fs");
const chalk = require("chalk");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

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

const headersConto = [
	{ id: "nome", title: "NOME" },
	{ id: "cognome", title: "COGNOME" },
	{ id: "idConto", title: "IDCONTO" },
];

const headersMovimento = [
	{ id: "idConto", title: "IDCONTO" },
	{ id: "importo", title: "IMPORTO" },
	{ id: "timestamp", title: "TIMESTAMP" },
];

const headersSaldo = [
	{ id: "IDCONTO", title: "IDCONTO" },
	{ id: "IMPORTO", title: "IMPORTO" },
	{ id: "TIMESTAMP", title: "TIMESTAMP" },
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
						console.log(chalk.inverse("\nVersamento sul conto\n"));
						await creaMovimento();
						break;
					case "5":
						console.log(chalk.inverse("\nPrelievo sul conto\n"));
						await creaMovimento();
						break;
					case "6":
						resolve(1);
				}

				console.log(
					chalk.inverse(
						"------------------------------------------------"
					)
				);

				resolve(0);
			});
		});
	} while (statusCode === 0);
};

const getIdConto = async (id = 0) => {
	const results = [];

	return new Promise((resolve, reject) => {
		fs.createReadStream("Anagrafica_conti.csv")
			.pipe(csv({ separator: ";" }))
			.on("data", data => results.push(data))
			.on("end", () => {
				id === 0
					? resolve(results.length + 1)
					: resolve(results.filter(e => Number(e.IDCONTO) === id)[0]);
			});
	});
};

const aggiornaSaldo = async (idConto, importoDaAggiungere) => {
	const saldiUtenti = await readFile("Saldo_conti.csv");

	const saldiAggiornati = saldiUtenti.map(e => {
		console.log(Number(e.IDCONTO) === Number(idConto));
		return Number(e.IDCONTO) === Number(idConto)
			? {
					IDCONTO: idConto.toString(),
					IMPORTO: Number(e.IMPORTO)
						? Number(e.IMPORTO) + Number(importoDaAggiungere)
						: Number(importoDaAggiungere),
					TIMESTAMP: `ORA: ${new Date().getHours()}:${new Date().getMinutes()} - DATA: ${new Date().getDate()}/${
						new Date().getMonth() + 1
					}/${new Date().getFullYear()}`,
			  }
			: e;
	});

	await writeFile(
		"Saldo_conti.csv",
		headersSaldo,
		saldiAggiornati,
		false
	).then(() =>
		console.log(chalk.inverse.green("Saldo aggiornato con successo\n"))
	);
};

const creaMovimento = async (idConto = null) => {
	idConto =
		idConto === null
			? await new Promise((resolve, reject) => {
					rl.question("Inserisci il tuo id: ", id => resolve(id));
			  })
			: idConto;

	const importo = await new Promise((resolve, reject) => {
		rl.question("\nInserisci importo: ", importo => {
			console.log(
				Number(importo) > 0
					? `\nVersati ${chalk.greenBright(importo)}??? sul conto\n`
					: `\nPrelevati ${chalk.redBright(importo)}??? dal conto\n`
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

	await writeFile(
		"SaldoMovimenti_conti.csv",
		headersMovimento,
		movimento
	).then(() =>
		console.log(
			chalk.inverse.green("Lista movimenti aggiornata con successo\n")
		)
	);

	await aggiornaSaldo(idConto, importo);

	return new Promise((resolve, reject) => resolve(importo));
};

const creaConto = async () => {
	console.log(chalk.inverse("\nCreazione conto"));

	const nome = await new Promise((resolve, reject) => {
		rl.question("\nInserisci il tuo nome: ", nome => resolve(nome));
	});

	const cognome = await new Promise((resolve, reject) => {
		rl.question("Inserisci il tuo cognome: ", cognome => resolve(cognome));
	});

	const idConto = await getIdConto();

	const conto = [{ nome: nome, cognome: cognome, idConto: idConto }];

	await writeFile("Anagrafica_conti.csv", headersConto, conto);

	console.log(
		chalk.bold.green(
			"\nBenvenuto, per completare la creazione del conto, ?? necessario depositare una somma iniziale\n"
		)
	);

	const importo = await creaMovimento(idConto);

	await writeFile("Saldo_conti.csv", headersSaldo, [
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
	console.log(chalk.inverse("\nSaldo conto\n"));

	const idConto = await new Promise((resolve, reject) => {
		rl.question("Inserisci il tuo id: ", id => resolve(id));
	});

	let saldi = await readFile("Saldo_conti.csv");

	console.log(saldi);

	saldi = saldi.filter(saldi => Number(saldi.IDCONTO) === Number(idConto))[0];

	const stringa = `Il tuo saldo alle ore ${new Date().getHours()}:${new Date().getMinutes()} del giorno ${new Date().getDate()}/${
		new Date().getMonth() + 1
	}/${new Date().getFullYear()} ?? di ${saldi.IMPORTO}???`;

	console.log(stringa);
};

const mostraMovimenti = async () => {
	console.log(chalk.inverse("\nMovimenti conto\n"));

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
