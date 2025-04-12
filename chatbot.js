const qrcode = require('qrcode-terminal');
const { Client, Buttons, List, MessageMedia } = require('whatsapp-web.js');
const client = new Client();

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});
client.on('ready', () => {
    console.log('Tudo certo! WhatsApp conectado.');
});
client.initialize();

const delay = ms => new Promise(res => setTimeout(res, ms));
let aguardandoSenha = {};

// GATILHOS
const GATILHO_SAUDACAO = /^(oi|olá|ola|bom dia|boa tarde|boa noite)$/i;
const OPC_REVENDEDOR = '1';
const OPC_CADASTRO = '2';
const OPC_CLIENTE = '3';

const OPC_PEDIDO = '1';
const OPC_SACOLINHA = '3';
const OPC_BOLSA = '4';
const OPC_RASTREIO = '5';
const OPC_SUPORTE = '6';
const OPC_SAIR = '7';

const OPC_SENHA_INFO = '1';
const OPC_SENHA_TENTAR = '2';
const OPC_SENHA_MENU = '3';

const SENHA_CORRETA = '123456';

client.on('message', async msg => {
    const chat = await msg.getChat();

    // 1. Saudação inicial
    if (msg.body.match(GATILHO_SAUDACAO)) {
        const contact = await msg.getContact();
        const name = contact.pushname;
        await chat.sendStateTyping();
        await client.sendMessage(msg.from,
            `Olá, ${name ? name.split(" ")[0] : ""}! 👋\n\n` +
            `Como podemos te ajudar hoje?\nEscolha uma das opções abaixo:\n\n` +
            `1 - Sou revendedor\n2 - Concluir cadastro\n3 - Sou cliente`
        );
        return;
    }

    // 2. Concluir cadastro
    if (msg.body === OPC_CADASTRO && msg.from.endsWith('@c.us')) {
        await chat.sendStateTyping();
        await client.sendMessage(msg.from, 'Vamos concluir seu cadastro! Por favor, informe seu nome completo e CPF para prosseguirmos.');
        return;
    }

    // 3. Sou cliente
    if (msg.body === OPC_CLIENTE && !aguardandoSenha[msg.from] && msg.from.endsWith('@c.us')) {
        await chat.sendStateTyping();
        await client.sendMessage(msg.from, 'Olá, cliente! 😊 Em que posso te ajudar hoje? Digite sua dúvida ou solicitação.');
        return;
    }

    // 4. Escolheu "Sou revendedor"
    if (msg.body === OPC_REVENDEDOR && !aguardandoSenha[msg.from]) {
        aguardandoSenha[msg.from] = 'esperandoSenha';
        await chat.sendStateTyping();
        await client.sendMessage(msg.from, 'Por favor, informe a sua senha de acesso.\nÉ aquela que enviamos para o seu e-mail. 🔐');
        return;
    }

    // 5. Verifica senha
    if (aguardandoSenha[msg.from] === 'esperandoSenha') {
        if (msg.body === SENHA_CORRETA) {
            aguardandoSenha[msg.from] = 'menuRevendedor';
            await chat.sendStateTyping();
            await client.sendMessage(msg.from, 'Senha correta! ✅ Seja bem-vindo à área de revendedores!');
            await client.sendMessage(msg.from,
                '(audio) Olá, tudo bem? 😊\n' +
                'Pra agilizar seu atendimento, é só digitar o número da opção desejada.\n\n' +
                '1 - Fazer pedido\n' +
                '3 - Repor sacolinhas Rede Revitta\n' +
                '4 - Comprar Bolsa Rede Revitta\n' +
                '5 - Rastrear pedido do cliente\n' +
                '6 - Suporte\n' +
                '7 - Sair'
            );
        } else {
            aguardandoSenha[msg.from] = 'senhaIncorreta';
            await chat.sendStateTyping();
            await client.sendMessage(msg.from,
                'Senha incorreta. 😕 Mas calma, estamos aqui pra te ajudar!\n\n' +
                'Escolha uma das opções abaixo:\n' +
                '1 - Onde encontro minha senha?\n' +
                '2 - Tentar novamente\n' +
                '3 - Voltar ao menu principal'
            );
        }
        return;
    }

    // 6. Tratamento para senha incorreta
    if (aguardandoSenha[msg.from] === 'senhaIncorreta') {
        if (msg.body === OPC_SENHA_INFO) {
            await chat.sendStateTyping();
            await client.sendMessage(msg.from, 'Você pode encontrar sua senha no e-mail que enviamos no momento do seu cadastro. 📨');
        } else if (msg.body === OPC_SENHA_TENTAR) {
            aguardandoSenha[msg.from] = 'esperandoSenha';
            await chat.sendStateTyping();
            await client.sendMessage(msg.from, 'Sem problemas! 😊 Digite sua senha novamente.');
        } else if (msg.body === OPC_SENHA_MENU) {
            delete aguardandoSenha[msg.from];
            const contact = await msg.getContact();
            const name = contact.pushname;
            await chat.sendStateTyping();
            await client.sendMessage(msg.from,
                `Olá, ${name ? name.split(" ")[0] : ""}! 👋\n\n` +
                `Como podemos te ajudar hoje?\nEscolha uma das opções abaixo:\n\n` +
                `1 - Sou revendedor\n2 - Concluir cadastro\n3 - Sou cliente`
            );
        }
        return;
    }

    // 7. Menu do revendedor (após senha correta)
    if (aguardandoSenha[msg.from] === 'menuRevendedor') {
        switch (msg.body) {
            case OPC_PEDIDO:
                aguardandoSenha[msg.from] = 'pedidoProduto';
                await chat.sendStateTyping();
                await client.sendMessage(msg.from,
                    'Qual produto você gostaria de fazer o pedido hoje? 😊\n\n' +
                    '1 - ozenvita\n' +
                    '2 - diurie fit\n' +
                    '3 - lift detox\n' +
                    '4 - slim gota\n' +
                    '5 - colagen vitta\n' +
                    '6 - nutraflit\n' +
                    '7 - visara\n' +
                    '8 - hidra liso\n' +
                    '9 - lizzante\n' +
                    '10 - fignar\n' +
                    '11 - curcumy\n' +
                    '12 - nutravida\n' +
                    '0 - voltar ao menu anterior'
                );
                break;

            case OPC_SACOLINHA:
                await chat.sendStateTyping();
                await client.sendMessage(msg.from, 'Beleza! Vamos repor as sacolinhas Rede Revitta. Quantas você precisa? 🎒');
                break;
            case OPC_BOLSA:
                await chat.sendStateTyping();
                await client.sendMessage(msg.from, 'Legal! Qual modelo de Bolsa Rede Revitta você deseja comprar? 👜');
                break;
            case OPC_RASTREIO:
                await chat.sendStateTyping();
                await client.sendMessage(msg.from, 'Certo! Me informe o número do pedido do cliente para rastrear. 🔍');
                break;
            case OPC_SUPORTE:
                await chat.sendStateTyping();
                await client.sendMessage(msg.from, 'Estamos aqui pra te ajudar! Qual é a sua dúvida ou problema? 🛠️');
                break;
            case OPC_SAIR:
                await chat.sendStateTyping();
                await client.sendMessage(msg.from, 'Ok! Encerramos seu atendimento. Quando precisar, é só chamar. 👋');
                delete aguardandoSenha[msg.from];
                break;
            default:
                await chat.sendStateTyping();
                await client.sendMessage(msg.from, 'Opção inválida. Por favor, digite um número entre 1 e 7. 😉');
        }
        return;
    }

    if (aguardandoSenha[msg.from] === 'pedidoProduto') {
        let produto = '';
    
        switch (msg.body) {
            case '1': produto = 'Ozenvita'; break;
            case '2': produto = 'Diurie Fit'; break;
            case '3': produto = 'Lift Detox'; break;
            case '4': produto = 'Slim Gota'; break;
            case '5': produto = 'Colagen Vitta'; break;
            case '6': produto = 'Nutraflit'; break;
            case '7': produto = 'Visara'; break;
            case '8': produto = 'Hidra Liso'; break;
            case '9': produto = 'Lizzante'; break;
            case '10': produto = 'Fignar'; break;
            case '11': produto = 'Curcumy'; break;
            case '12': produto = 'Nutravida'; break;
            case '0':
                aguardandoSenha[msg.from] = 'menuRevendedor';
                await chat.sendStateTyping();
                await client.sendMessage(msg.from,
                    'Você voltou ao menu anterior. Escolha uma das opções:\n\n' +
                    '1 - Fazer pedido\n' +
                    '3 - Repor sacolinhas Rede Revitta\n' +
                    '4 - Comprar Bolsa Rede Revitta\n' +
                    '5 - Rastrear pedido do cliente\n' +
                    '6 - Suporte\n' +
                    '7 - Sair'
                );
                return;
    
            default:
                await chat.sendStateTyping();
                await client.sendMessage(msg.from, 'Opção inválida. Por favor, escolha um número de 1 a 12 ou digite 0 para voltar ao menu anterior.');
                return;
        }
    
        await chat.sendStateTyping();
        await client.sendMessage(msg.from, `Pedido registrado para o produto *${produto}* ✅\nNosso time vai confirmar com você em breve!`);
    
        // volta pro menu revendedor
        aguardandoSenha[msg.from] = 'menuRevendedor';
        return;
    }
});
