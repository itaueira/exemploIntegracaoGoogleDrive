const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const mimeType = require('mime-types');
const logger = require('./logger');
const fsPromises = require('fs').promises;
// -- DADOS 0AUTH CLIENT 2.0 --

//INFORMAR O CLIENT ID DA CREDENCIAL 
const CLIENT_ID = 'XXXXXXXXXXX-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.XXX.googleusercontent.com';
//INFORMAR O CLIENT SECRET DA CREDENCIAL 
const CLIENT_SECRET = 'YYYYYYY-xxxxxxxxxxxxxxyzysyyyyyyyyyyyyyyyyyzzzzz';
//INFORMAR A URI DE REDIRECIONAMENTO DA APLICAÇÃO 
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';
//INFORMAR O TOKEN DE UTILIZAÇÃO DA APLICAÇÃO
const REFRESH_TOKEN = 'X//XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX-XXXXXXXXXXXYYYZZZZZ';

//REALIZA A INSTÂNCIA E SETA OS DADOS DE CREDENCIAMENTE DA APLICAÇÃO
const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN })

//CRIA O OBJETO DO DRIVE, INFORMANDO A VERSÃO E A AUTENTICAÇÃO
const drive = google.drive({
    version: 'v3',
    auth: oAuth2Client
});
//CAMINHO DO DIRETÓRIO ONDE ESTÃO OS ARQUIVOS A SEREM ENVIADOS PARA O DRIVE.
const __dirArquivos = 'C:\\Users\\Alex Frazao\\Documents\\MovimentacaoITR';

//ID DA PASTA DO DRIVE ONDE SERÁ ARMAZENADO OS ARQUIVOS IMPORTADOS
const GOOGLE_DRIVE_FOLDER_ID = '1Pqu-IZp6Hxso-rqXi4OqYL3zCYSkIccu';

/* FUNÇÃO QUE REALIZA O UPLOAD DOS ARQUIVOS A PARTIR DO MÉTODO (CREATE) PARA O DRIVE CONFIGURADO, PASSANDO AS DEFINIÇÕES DO ARQUIVO COMO NOME,
* MIMETYPE, ENDEREÇO DA PASTA.
*/

async function uploadFile() {
    try {
    
        let arquivos, __dirProcessados, dataHoje, filePath, response = null;
        dataHoje = new Date();
        __dirProcessados = __dirArquivos + '\\processados';

        if(fs.existsSync(__dirArquivos)) {
            arquivos = fs.readdirSync(__dirArquivos);

            // PROCESSA E ENVIA OS ARQUIVOS PARA O DRIVE
    
            arquivos.forEach( async function (arquivo){
                //SELECIONA APENAS O QUE FOR ARQUIVO PARA PREPARAR PARA ENVIAR
                fs.lstat(__dirArquivos+'/'+arquivo, (error, stats) => {
                    if(error)
                        logger.error('Não foi possível selecionar os arquivos para realizar a leitura!\nDetalhes do erro: \n'+error.message+'\n'+error.stack);
                    if(stats.isFile()){
                        
                        fs.readFile(__dirArquivos +'\\'+ arquivo, async function(error) {
                            
                            filePath = __dirArquivos +'\\'+ arquivo;
                            if(error) {
                                logger.error('Não foi possível realizar a leitura dos arquivos!\nDetalhes do erro: \n'+error.message+'\n'+error.stack);
                            } else {
                                try {
                                    response = drive.files.create({
                                        requestBody: {
                                            name: arquivo,
                                            mimeType: mimeType.lookup(arquivo),
                                            parents: [GOOGLE_DRIVE_FOLDER_ID]
                                        },
                                        media: {
                                            mimeType: mimeType.lookup(arquivo),
                                            body: fs.createReadStream(filePath),
                                        }
                                    });
                                    // REGISTRA NO LOG QUE O ARQUIVO FOI ENVIADO COM SUCESSO PARA O DRIVE 
                                    logger.info('Arquivo enviado com sucesso!\nNome: '+arquivo+'.');

                                    //VERIFICA SE EXISTE O DIRETÓRIO PARA ARMAZENAR OS ARQUIVOS PROCESSADOS, CASO NÃO EXISTA SERÁ CRIADO.
                                    if(!fs.existsSync(__dirProcessados)) {
                                        fs.mkdirSync(__dirProcessados);
                                        logger.info('O diretório para armazenar os arquivos procesados foi criado: '+__dirProcessados+'.');
                                    }

                                    // RENOMEIA O ARQUIVO COM DATA E HORA FORMATADA NA PASTA DE PROCESSADOS QUE JÁ FOI ENVIADO DRIVE E APAGA O ARQUIVO ORIGINAL NO DIRETÓRIO __dirArquivos.
                                    await fsPromises.rename(filePath, __dirProcessados+'\\'+geraNovoNomeDoArquivo(dataHoje, __dirArquivos, arquivo));
                                    logger.info('Arquivo '+arquivo+' renomeado para '+geraNovoNomeDoArquivo(dataHoje, __dirArquivos, arquivo)+'.\nRemovido do diretório '+__dirArquivos+' e movido para '+__dirProcessados+'.');
                                    
                                } catch(error) {
                                    logger.error('Não foi possível realizar a importação dos arquivos!\nDetalhes do erro: \n'+error.message+'\n'+error.stack);
                                }
                            } 
                        });
                    }
                });
            });
        } else {
            logger.error('Não foi localizado o diretório informado para ler os arquivos!\nDetalhes do erro: \n'+error.message+'\n'+error.stack);  
        }

    } catch(error) {
        logger.error('Não foi possível realizar a importação dos arquivos!\nDetalhes do erro: \n'+error.message+'\n'+error.stack);
    }
}

//FUNÇÃO RESPONSÁVEL POR GERAR UM NOVO NOME PARA O ARQUIVO PROCESSADO.
function geraNovoNomeDoArquivo(dataHoje, dirArquivo, arquivo){
    let novoNomeArquivo, dataFormatada = null;

    dataFormatada = dataHoje.getFullYear()+''+(dataHoje.getMonth()+1)+dataHoje.getDate()+'_'
    +dataHoje.toTimeString().replace(':','').replace(':','').substr(0, 6);
    
    extensaoArquivo = path.extname(dirArquivo+'/'+arquivo);

    novoNomeArquivo = path.basename(arquivo, extensaoArquivo)+'_'+dataFormatada+extensaoArquivo;

    return novoNomeArquivo;
}

module.exports = uploadFile();
