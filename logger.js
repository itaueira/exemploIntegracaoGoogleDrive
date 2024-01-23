//INCLUI A BIBLIOTECA PARA CRIAÇÃO DE LOGS
const {createLogger, transports, format} = require('winston');
const { combine, printf } = format;
const fs = require('fs');

//CAMINHO DO DIRETÓRIO ONDE OS LOGS DA APLICAÇÃO SERÃO SALVOS
const __dirArquivoLogs = 'C:\\Users\\Alex Frazao\\Documents\\MovimentacaoITR';

//TRATA A DATA E HORA AO INVÉS DE UTILIZAR A PROPRIEDADE TIMESTAMP
var dataHoje = new Date();
var dataFormatada = dataHoje.getFullYear()+'-'+(dataHoje.getMonth()+1)+'-'+dataHoje.getDate();
var horaFormatada = dataHoje.getHours()+':'+dataHoje.getMinutes()+':'+dataHoje.getSeconds();

//FUNÇÃO QUE AJUSTA O FORMATO DAS MENSAGENS EXIBIDAS NO ARQUIVO DE LOG
const myFormat = printf(({ level, message, }) => {
    return `${dataFormatada+' '+horaFormatada} [${level.toUpperCase()}] ${message}`;
});

//CRIA PASTA OU ARQUIVO DE LOG
function criaPastaOuArquivoLogger() {
    let dataArquivo, dataHojeReajustada, maiorData = null;

    dataHojeReajustada = dataFormatada.replace('-','').replace('-','');

    if(!fs.existsSync(__dirArquivoLogs+'\\'+'logs')) {
        fs.mkdirSync(__dirArquivoLogs+'\\'+'logs');
    }
    let arquivos = fs.readdirSync(__dirArquivoLogs+'\\logs');
    arquivos.forEach(function (arquivo, i) {
        
        dataArquivo = arquivo.split('log_')[1].split('.log')[0];

        if(i == 0) {
            maiorData = dataArquivo;
        }

        if(dataHojeReajustada > maiorData) {
            maiorData = dataHojeReajustada; 
        }         
    },);

    return __dirArquivoLogs+'\\logs\\log_'+dataHojeReajustada+'.log';
}


// CRIA O LOG PERSONALIZADO
const logger = createLogger({

    //DEFINIR O NÍVEL MÍNIMO DE LOG (DEBUG, INFO, WARN, ERROR)
    level: "info",
   
    //COMBINA O FORMATO AJUSTADO PARA EXIBIÇÃO
    format: combine(
        myFormat
    ),

    //DEFINIR OS MÉTODOS DE LOG (INFO, WARN, ERROR, ETC..)
    transports: [
        //DETERMINA ONDE SERÁ SALVO OS LOGS
        new transports.File({
            filename: criaPastaOuArquivoLogger()
        }),
    ]
});

//EXPORTA O LOG PARA SER UTILIZADO EM OUTROS MÓDULOS DA APLICAÇÃO
module.exports = logger;
