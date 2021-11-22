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

const getSaldiConti = async () => {
	const results = [];

	return new Promise((resolve, reject) => {
		fs.createReadStream("Saldo_conti.csv")
			.pipe(csv({ separator: ";" }))
			.on("data", data => results.push(data))
			.on("end", () => {
				resolve(results);
			});
	});
};

const getMovimentoConti = async () => {
	const results = [];

	return new Promise((resolve, reject) => {
		fs.createReadStream("SaldoMovimenti_conti.csv")
			.pipe(csv({ separator: ";" }))
			.on("data", data => results.push(data))
			.on("end", () => {
				resolve(results);
			});
	});
};

const aggiornaSaldo = async (idConto, importoDaAggiungere) => {
	const Saldi = createCsvWriter({
		fieldDelimiter: ";",
		path: "./Saldo_conti.csv",
		header: [
			{ id: "IDCONTO", title: "IDCONTO" },
			{ id: "IMPORTO", title: "IMPORTO" },
			{ id: "TIMESTAMP", title: "TIMESTAMP" },
		],
	});

	const saldiUtenti = await getSaldiConti();

	const saldiAggiornati =
		saldiUtenti.length > 0 &&
		saldiUtenti.filter(e => Number(e.IDCONTO) === idConto).length === 1
			? saldiUtenti.map(saldo => {
					console.log(saldo.IMPORTO);
					Number(saldo.IDCONTO) === idConto
						? {
								IDCONTO: idConto,
								IMPORTO: Number(saldo.IMPORTO)
									? Number(saldo.IMPORTO) +
									  Number(importoDaAggiungere)
									: Number(importoDaAggiungere),
								TIMESTAMP: `ORA: ${new Date().getHours()}:${new Date().getMinutes()} - DATA: ${new Date().getDate()}/${
									new Date().getMonth() + 1
								}/${new Date().getFullYear()}`,
						  }
						: saldo;
			  })
			: [
					{
						IDCONTO: idConto,
						IMPORTO: Number(importoDaAggiungere),
						TIMESTAMP: `ORA: ${new Date().getHours()}:${new Date().getMinutes()} - DATA: ${new Date().getDate()}/${
							new Date().getMonth() + 1
						}/${new Date().getFullYear()}`,
					},
			  ];

	console.log();

	await Saldi.writeRecords(saldiAggiornati).then(() =>
		console.log("Saldi Aggiornati con successo")
	);

	// return new Promise(resolve => resolve("Saldo Aggiornato con successo"));
};

const creaMovimento = async (idConto = null) => {
	idConto =
		idConto === null
			? await new Promise((resolve, reject) => {
					rl.question("Inserisci il tuo id: ", id => resolve(id));
			  })
			: idConto;

	const Movimenti = createCsvWriter({
		append: true,
		fieldDelimiter: ";",
		path: "./SaldoMovimenti_conti.csv",
		header: [
			{ id: "idConto", title: "IDCONTO" },
			{ id: "importo", title: "IMPORTO" },
			{ id: "timestamp", title: "TIMESTAMP" },
		],
	});

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

	await Movimenti.writeRecords(movimento).then(() => {
		console.log("\nMovimento conto aggiornato con successo\n");
	});

	aggiornaSaldo(idConto, importo);
};

const creaConto = async () => {
	const Conti = createCsvWriter({
		append: true,
		fieldDelimiter: ";",
		path: "./Anagrafica_conti.csv",
		header: [
			{ id: "nome", title: "NOME" },
			{ id: "cognome", title: "COGNOME" },
			{ id: "idConto", title: "IDCONTO" },
		],
	});

	const nome = await new Promise((resolve, reject) => {
		rl.question("Inserisci il tuo nome: ", nome => resolve(nome));
	});

	const cognome = await new Promise((resolve, reject) => {
		rl.question("Inserisci il tuo cognome: ", cognome => resolve(cognome));
	});

	const idConto = await getIdConto();

	const conto = [{ nome: nome, cognome: cognome, idConto: idConto }];

	await Conti.writeRecords(conto).then(() => {
		console.log("\nConto corrente creato con successo\n");
	});

	console.log(
		"Benvenuto, per completare la creazione del conto, è necessario depositare una somma iniziale\n"
	);

	await creaMovimento(idConto);
};

const mostraSaldo = async () => {
	const idConto = await new Promise((resolve, reject) => {
		rl.question("Inserisci il tuo id: ", id => resolve(id));
	});

	let saldi = await getSaldiConti();

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

	let movimenti = await getMovimentoConti();

	movimenti = movimenti
		.filter(movimento => movimento.IDCONTO === idConto)
		.forEach(movimento => {
			console.log(movimento.IMPORTO, movimento.TIMESTAMP);
		});

	return new Promise((resolve, reject) => resolve(movimenti));
};

console.log(
	chalk.greenBright("Welcome to SmartBK, your personal online bank \n")
);

chooseAction();
