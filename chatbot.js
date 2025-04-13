// ########################## Inicializar o Bot - Inicio ##########################

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

// ########################## Inicializar o Bot - Fim ##########################









// ########################## Variaveis de configurações - Inicio ##########################

// const usuariosAtivos = {};
let aguardandoSenha = {};
let aguardando = {};

// ########################## Variaveis de configurações - Fim ##########################








// ########################## Variaveis para armazenar os gatilhos - Inicio ##########################

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

// ########################## Variaveis para armazenar os gatilhos - Fim ##########################




// ########################## Funções auxiliares - Inicio ##########################

async function mostrarMenuRevendedor(msg) {
    const chat = await msg.getChat();
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
}

// ########################## Funções auxiliares - Fim ##########################







// ########################## Inicio do bot  - Inicio ##########################

client.on('message', async msg => {
    const primeiraPalavra = msg.body.trim().toLowerCase().split(' ')[0];
    const chat = await msg.getChat();

    // const agora = Date.now();
    // const UMA_SEMANA = 7 * 24 * 60 * 60 * 1000;

    // if (!usuariosAtivos[msg.from] || agora - usuariosAtivos[msg.from] > UMA_SEMANA) {
    //     usuariosAtivos[msg.from] = agora;
    //     const contact = await msg.getContact();
    //     const name = contact.pushname;
    //     await chat.sendStateTyping();
    //     await client.sendMessage(msg.from,
    //         `Olá, ${name ? name.split(" ")[0] : ""}! 👋\n\n` +
    //         `Como podemos te ajudar hoje?\nEscolha uma das opções abaixo:\n\n` +
    //         `1 - Sou revendedor\n2 - Concluir cadastro\n3 - Sou cliente`
    //     );
    //     return;
    // }



    // if (msg.body.match(primeiraPalavra) == 'Cadastro') {
    //     const contact = await msg.getContact();
    //     // const name = contact.pushname;
    //     await chat.sendStateTyping();
    //     await client.sendMessage(msg.from, `teste`);
    //     return;
    // }

    async function mostrarMenuPrincipal(msg) {
        const contact = await msg.getContact();
        const name = contact.pushname;
        await client.sendMessage(msg.from,
            `Olá, ${name ? name.split(" ")[0] : ""}! 👋\n\n` +
            `Como podemos te ajudar hoje?\nEscolha uma das opções abaixo:\n\n` +
            `1 - Sou revendedor\n2 - Concluir cadastro\n3 - Sou cliente`
        );
    }

// ########################## Inicio do fluxo que vem do site - Inicio ##########################
    if (msg.body === '0') {
        delete aguardando[msg.from]; // limpa qualquer estado anterior, se necessário
        await chat.sendStateTyping();
        await mostrarMenuPrincipal(msg);
        return;
    }
    
    if (
        primeiraPalavra === 'cadastro' &&
        msg.body.toLowerCase().includes('nome:') &&
        msg.body.toLowerCase().includes('telefone:') &&
        msg.body.toLowerCase().includes('email:')
    ) {
        await chat.sendStateTyping();
        await client.sendMessage(msg.from, 'Aguarde um instante, estamos validando suas informações⏳😊');

        await delay(10000); // espera 10 segundos
        await chat.sendStateTyping();

        await client.sendMessage(msg.from,
            '🎉 Você foi cadastrado com sucesso!\n\n' +
            'Estamos quase lá... Para ativar o seu cadastro, é necessário adquirir nosso material exclusivo para ter um melhor aproveitamento. 💼✨\n\n' +
            'Vamos lá?\n' +
            '👉 https://rederevitta.lojavirtualnuvem.com.br/produtos/revista-sacolinhas-bolsa/'
        );
        return;
    }

// ########################## Inicio do fluxo que vem do site  - Fim ##########################


// ########################## Inicio do fluxo padrão - Inicio ##########################

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
    if (!aguardandoSenha[msg.from]) {

        if (msg.body === OPC_REVENDEDOR) {
            aguardandoSenha[msg.from] = 'esperandoSenha';
            await chat.sendStateTyping();
            await client.sendMessage(msg.from, 'Por favor, informe a sua senha de acesso.\nÉ aquela que enviamos para o seu e-mail. 🔐');
            return;
        }

        if (msg.body === OPC_CADASTRO && msg.from.endsWith('@c.us')) {
            aguardando[msg.from] = { estado: 'cadastroLink' };
            await chat.sendStateTyping();
            await client.sendMessage(msg.from,
                '📋 Que ótimo saber que você quer fazer parte da nossa Rede Revitta!\n\n' +
                'Para concluir seu cadastro, basta clicar no link abaixo e preencher o formulário:\n' +
                '👉 https://redereitta.github.io/RedeRevitta/sejarevendedor.html\n\n' +
                'Quando terminar, digite *0* para voltar ao menu principal. 😊'
            );
            return;
        }

        if (aguardando[msg.from]?.estado === 'infoProdutoCliente') {
            switch (msg.body) {
                case '1':
                    await chat.sendStateTyping();
                    await client.sendMessage(msg.from, '🧠 *Ozenvita*: Suplemento natural para foco e memória, ideal para produtividade no dia a dia.');
                    break;
                case '2':
                    await chat.sendStateTyping();
                    await client.sendMessage(msg.from, '💧 *Diurie Fit*: Auxilia na retenção de líquidos, promovendo leveza e bem-estar.');
                    break;
                case '3':
                    await chat.sendStateTyping();
                    await client.sendMessage(msg.from, '🔥 *Lift Detox*: Desintoxicante natural que auxilia na eliminação de toxinas do organismo.');
                    break;
                case '4':
                    await chat.sendStateTyping();
                    await client.sendMessage(msg.from, '⚖️ *Slim Gota*: Gotas naturais que ajudam no controle do apetite e perda de peso.');
                    break;
                case '5':
                    await chat.sendStateTyping();
                    await client.sendMessage(msg.from, '💪 *Colagen Vitta*: Suplemento de colágeno que fortalece unhas, cabelo e articulações.');
                    break;
                case '6':
                    await chat.sendStateTyping();
                    await client.sendMessage(msg.from, '🍃 *Nutralfit*: Fórmula natural para mais energia e disposição no dia a dia.');
                    break;
                case '7':
                    await chat.sendStateTyping();
                    await client.sendMessage(msg.from, '🌸 *Visara*: Ajuda a manter o equilíbrio hormonal e bem-estar feminino.');
                    break;
                case '8':
                    await chat.sendStateTyping();
                    await client.sendMessage(msg.from, '💆‍♀️ *Hidra Liso*: Tratamento capilar que hidrata e promove efeito liso natural.');
                    break;
                case '9':
                    await chat.sendStateTyping();
                    await client.sendMessage(msg.from, '🧴 *Lizzante*: Máscara poderosa para cabelos mais lisos, macios e sem frizz.');
                    break;
                case '10':
                    await chat.sendStateTyping();
                    await client.sendMessage(msg.from, '🫀 *Fignar*: Fórmula que auxilia na saúde do fígado e sistema digestivo.');
                    break;
                case '11':
                    await chat.sendStateTyping();
                    await client.sendMessage(msg.from, '🌿 *Curcumy*: Suplemento à base de cúrcuma, com ação anti-inflamatória e antioxidante.');
                    break;
                case '12':
                    await chat.sendStateTyping();
                    await client.sendMessage(msg.from, '❤️ *Nutravida*: Multivitamínico completo para fortalecer o sistema imunológico.');
                    break;
                case '0':
                    delete aguardando[msg.from];
                    const contact = await msg.getContact();
                    const name = contact.pushname;
                    await chat.sendStateTyping();
                    await client.sendMessage(msg.from,
                        `Olá, ${name ? name.split(" ")[0] : ""}! 👋\n\n` +
                        `Como podemos te ajudar hoje?\nEscolha uma das opções abaixo:\n\n` +
                        `1 - Sou revendedor\n2 - Concluir cadastro\n3 - Sou cliente`
                    );
                    return;
                default:
                    await chat.sendStateTyping();
                    await client.sendMessage(msg.from,
                        'Opção inválida. Digite um número de 1 a 12 para saber mais sobre um produto, ou 0 para voltar ao menu principal.'
                    );
                    return;
            }
        
            return;
        }        
    
        if (msg.body === OPC_CLIENTE && msg.from.endsWith('@c.us')) {
            aguardando[msg.from] = { estado: 'infoProdutoCliente' };
            await chat.sendStateTyping();
            await client.sendMessage(msg.from,
                '🛍️ Sobre qual produto você quer saber mais?\n\n' +
                '1 - Ozenvita\n' +
                '2 - Diurie Fit\n' +
                '3 - Lift Detox\n' +
                '4 - Slim Gota\n' +
                '5 - Colagen Vitta\n' +
                '6 - Nutralfit\n' +
                '7 - Visara\n' +
                '8 - Hidra Liso\n' +
                '9 - Lizzante\n' +
                '10 - Fignar\n' +
                '11 - Curcumy\n' +
                '12 - Nutravida\n\n' +
                '0 - Voltar ao menu principal'
            );
            return;
        }
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
                aguardandoSenha[msg.from] = 'sacolaLink';
                await chat.sendStateTyping();
                await client.sendMessage(msg.from,
                    '🎒 Que bom que você está repondo suas sacolinhas Rede Revitta!\n\n' +
                    'Clique no link abaixo para fazer a compra do kit com 10 sacolas:\n' +
                    '👉 https://rederevitta.lojavirtualnuvem.com.br/produtos/kit-10-sacolinhas-rede-revitta/\n\n' +
                    'Quando terminar, digite *0* para voltar ao menu principal.'
                );
                return;

            case OPC_BOLSA:
                aguardandoSenha[msg.from] = 'bolsaLink';
                await chat.sendStateTyping();
                await client.sendMessage(msg.from,
                    '👜 A Bolsa Rede Revitta é perfeita para você transportar seus produtos com estilo e praticidade!\n\n' +
                    'Clique no link abaixo para ver e comprar a sua:\n' +
                    '👉 https://rederevitta.lojavirtualnuvem.com.br/produtos/bolsa-rede-revitta/\n\n' +
                    'Quando terminar, digite *0* para voltar ao menu principal.'
                );
                return;   

            case OPC_RASTREIO:
                aguardandoSenha[msg.from] = 'rastreioPedido';
                await chat.sendStateTyping();
                await client.sendMessage(msg.from,
                    '🛫 Para acompanhar o pedido do seu cliente, verifique o código de rastreamento enviado para o seu e-mail no momento da compra e insira esse código no site abaixo.\n\n' +
                    'Clique no link abaixo para rastrear su compra:\n' +
                    '👉 https://rastreamento.correios.com.br/app/index.php\n\n' +
                    'Quando terminar, digite *0* para voltar ao menu principal.'
                );
                return;

            case OPC_SUPORTE:
                aguardandoSenha[msg.from] = 'suporte';
                await chat.sendStateTyping();
                await client.sendMessage(msg.from,
                    'Olá sou o Robô assistente da Rede Revitta, peço-lhe que deixe sua dúvida e aguarde um momento que nosso time de suporte entrara em contato contigo. 🛠\n\n' +
                    'Quando terminar, digite *0* para voltar ao menu principal.'
                );
                return;
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








    if (aguardando[msg.from]?.estado === 'cadastroLink') {
        if (msg.body === '0') {
            aguardando[msg.from] = { estado: 'menuRevendedor' };
            await chat.sendStateTyping();
            await mostrarMenuRevendedor(msg);
        } else {
            await chat.sendStateTyping();
            await client.sendMessage(msg.from,
                'Se ainda não concluiu, acesse o link acima para finalizar o cadastro. 📋\n\n' +
                'Ou digite *0* para voltar ao menu.'
            );
        }
        return;
    }






    if (aguardandoSenha[msg.from] === 'suporte') {
        if (msg.body === '0') {
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
        } else {
            await chat.sendStateTyping();
            await client.sendMessage(msg.from,
                'Se precisar, clique no link acima para rastrear suas compras. 😊\n\n' +
                'Ou digite *0* para voltar ao menu.'
            );
        }
        return;
    }

    if (aguardandoSenha[msg.from] === 'rastreioPedido') {
        if (msg.body === '0') {
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
        } else {
            await chat.sendStateTyping();
            await client.sendMessage(msg.from,
                'Se precisar, clique no link acima para rastrear suas compras. 😊\n\n' +
                'Ou digite *0* para voltar ao menu.'
            );
        }
        return;
    }

    if (aguardandoSenha[msg.from] === 'sacolaLink') {
        if (msg.body === '0') {
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
        } else {
            await chat.sendStateTyping();
            await client.sendMessage(msg.from,
                'Se precisar, clique no link acima para comprar o kit de sacolas. 😊\n\n' +
                'Ou digite *0* para voltar ao menu.'
            );
        }
        return;
    }

    if (aguardandoSenha[msg.from] === 'bolsaLink') {
        if (msg.body === '0') {
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
        } else {
            await chat.sendStateTyping();
            await client.sendMessage(msg.from,
                'Se precisar, clique no link acima para adquirir sua bolsa. 😊\n\n' +
                'Ou digite *0* para voltar ao menu.'
            );
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
        
        // salva o produto escolhido temporariamente
        aguardandoSenha[msg.from] = {
            estado: 'quantidadeProduto',
            produto: produto
        };
    
        await chat.sendStateTyping();
        await client.sendMessage(msg.from,
            `Você escolheu o *${produto}*.\nQuantos potes deseja?\n\n` +
            '1 - 1 pote\n' +
            '2 - 3 potes\n' +
            '3 - 5 potes\n' +
            '0 - Voltar ao menu anterior'
        );
    
        return;
    }
    
    // tratamento da quantidade
    if (
        typeof aguardandoSenha[msg.from] === 'object' &&
        aguardandoSenha[msg.from].estado === 'quantidadeProduto'
    ) {
        const produto = aguardandoSenha[msg.from].produto;
        let quantidade = '';
    
        switch (msg.body) {
            case '1': quantidade = '1 pote'; break;
            case '2': quantidade = '3 potes'; break;
            case '3': quantidade = '5 potes'; break;
            case '0':
                // volta ao menu anterior
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
                await client.sendMessage(msg.from, 'Escolha inválida. Digite:\n1 para 1 pote\n2 para 3 potes\n3 para 5 potes\n0 para voltar.');
                return;
        }
    
        await chat.sendStateTyping();
        await client.sendMessage(msg.from,
            `Pedido registrado com sucesso! ✅\nProduto: *${produto}*\nQuantidade: *${quantidade}*\n\nNosso time vai confirmar com você em breve!`
        );
    
        aguardandoSenha[msg.from] = 'menuRevendedor';
        return;
    }
    
});
