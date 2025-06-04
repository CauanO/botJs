const qrcode = require('qrcode-terminal');
const { Client, Buttons, List, MessageMedia, LocalAuth } = require('whatsapp-web.js');
const path = require('path');

const client = new Client({
    authStrategy: new LocalAuth({ clientId: 'ij-delivery-bot' }),
    puppeteer: {
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', qr => {
    console.clear();
    qrcode.generate(qr, { small: true });
    console.log('\nEscaneie o QR code acima para autenticar no WhatsApp.');
});

client.on('ready', () => {
    console.log('✅ Bot conectado ao WhatsApp com sucesso!');
});

client.on('auth_failure', msg => {
    console.error('❌ Falha na autenticação', msg);
});

client.on('disconnected', reason => {
    console.warn('⚠️ Cliente desconectado!', reason);
});

client.initialize();

const delay = ms => new Promise(res => setTimeout(res, ms));
let aguardandoSenha = {};

const GATILHO_SAUDACAO = /^(oi|olá|ola|bom dia|boa tarde|boa noite)$/i;
const precosFrete = {
    "bom será": 3,
    "licurizal": 3,
    "buraco d’água": 3,
    "lagoa velha": 5,
    "gazai": 5,
    "baixa da ema": 5,
    "batista": 7,
    "ipoeira": 7,
    "pedra azul": 7,
    "pindura saia": 10,
    "roma": 10,
    "araticum": 12,
    "quatro estradas": 15,
    "ponto": 15,
    "cabeça do boi": 15
};
const VALOR_ACAI = 10.00;
const TAXA_DEBITO = 1.43;
const TAXA_CREDITO = 3.38;
client.on('message', async msg => {
    const chat = await msg.getChat();

    if (msg.body.match(GATILHO_SAUDACAO)) {
        await chat.sendStateTyping();
        await client.sendMessage(msg.from,
            'Olá 😄 Tudo bem?\Que bom te ver por aqui! Sou o robô assistente da IJ Delivery ,e irei agilizar seu pedido.'
        );
        await delay(1500);
        await chat.sendStateTyping();
        await client.sendMessage(msg.from, 'Para continuarmos, *me informa só seu nome* por favor?');
        aguardandoSenha[msg.from] = 'esperandoNome';
        return;
    }

    if (aguardandoSenha[msg.from] === 'esperandoNome') {
        const nome = msg.body.trim();
        await chat.sendStateTyping();
        await client.sendMessage(msg.from, `Perfeito, ${nome}! 👏`);
        await delay(1500);

        const imagePath = path.join(__dirname, 'img', 'cardapio.jpg');
        const cardapio = MessageMedia.fromFilePath(imagePath);

        await chat.sendStateTyping();
        await client.sendMessage(msg.from, cardapio, {
            // caption: '📋 *Cardápio Atualizado!*\nEscolha sua pizza ou açaí preferido 😋'
        });

        await delay(1500);
        await chat.sendStateTyping();
        await client.sendMessage(msg.from,
            `Qual seu pedido hoje, ${nome}? 😊\n\n*PIZZA 🍕*\n*AÇAÍ 🍧*`
        );

        aguardandoSenha[msg.from] = { etapa: 'aguardandoPedido', nome };
        return;
    }

    const dados = aguardandoSenha[msg.from];
    if (!dados || !dados.etapa) return;

    switch (dados.etapa) {
        case 'aguardandoPedido': {
            const pedido = msg.body.trim().toLowerCase();
            if (pedido.includes('pizza')) {
                await chat.sendStateTyping();
                await client.sendMessage(msg.from, `🍕 Vamos montar sua pizza, ${dados.nome}!`);
                delete aguardandoSenha[msg.from];
            } else if (pedido.includes('açaí') || pedido.includes('acai')) {
                await chat.sendStateTyping();
                await client.sendMessage(msg.from, `🍧 Vamos montar seu açaí, ${dados.nome}!`);
                await client.sendMessage(msg.from,
                    'Qual açaí você gosta mais?\n\n' +
                    '🍧 *Açaí Tradicional*\n' +
                    '🍓 *Açaí de Morango*\n' +
                    '🍌 *Açaí de Banana*'
                );
                dados.etapa = 'aguardandoSaborAcai';
                dados.comanda = {};
            } else {
                await chat.sendStateTyping();
                await client.sendMessage(msg.from, '❌ Opção inválida. Digite apenas *PIZZA* ou *AÇAÍ*.');
            }
            break;
        }
        case 'aguardandoSaborAcai': {
            const sabor = msg.body.trim();
            dados.comanda.saborAcai = sabor;
            dados.etapa = 'aguardandoAdicionais';
            await chat.sendStateTyping();
            await client.sendMessage(msg.from,
                'Agora vamos para os adicionais?\n\n' +
                '✅ Você pode escolher até *3 adicionais* que são de cortesia.\n' +
                '⚠️ Caso prefira mais adicionais, é cobrado apenas *R$1,50 por adicional extra*.'
            );
            await client.sendMessage(msg.from,
                'Digite os adicionais separados por vírgula:\n\n' +
                '• Leite em Pó\n' +
                '• MMs\n' +
                '• Calda de Morango\n' +
                '• Calda de Chocolate\n' +
                '• Granola\n' +
                '• Leite Condensado\n' +
                '• Granulado Colorido\n' +
                '• Granulado de Chocolate\n' +
                '• Coco Ralado'
            );            
            break;
        }
        case 'aguardandoAdicionais': {
            const adicionais = msg.body.split(',').map(a => a.trim()).filter(a => a);
            dados.comanda.adicionaisSelecionados = adicionais;
        
            if (adicionais.length > 3) {
                const extras = adicionais.slice(3);
                const custo = extras.length * 1.5;
        
                await chat.sendStateTyping();
                await client.sendMessage(msg.from,
                    `⚠️ Você escolheu mais de 3 adicionais.\n` +
                    `Será cobrado *R$1,50* por adicional extra.\n\n` +
                    `💰 Total de adicionais pagos: *${extras.length} x R$1,50 = R$ ${custo.toFixed(2)}*\n\n` +
                    `Deseja manter esses adicionais?\n*Responda: SIM ou NÃO*`
                );
        
                dados.etapa = 'confirmarAdicionaisPagos';
            } else {
                dados.comanda.adicionais = adicionais;
                dados.comanda.valorExtras = 0;
                dados.etapa = 'perguntarOutroAcai';
        
                await chat.sendStateTyping();
                await client.sendMessage(msg.from, '❓ Deseja montar outro açaí?\n*Responda: SIM ou NÃO*');
            }
            break;
        }
        
        case 'confirmarAdicionaisPagos': {
            const resposta = msg.body.trim().toLowerCase();
            const adicionais = dados.comanda.adicionaisSelecionados;
            if (resposta === 'sim') {
                const extras = adicionais.slice(3);
                const custo = extras.length * 1.5;
                dados.comanda.adicionais = adicionais;
                dados.comanda.valorExtras = custo;
            } else {
                dados.comanda.adicionais = adicionais.slice(0, 3);
                dados.comanda.valorExtras = 0;
            }
            dados.etapa = 'perguntarOutroAcai';
            await chat.sendStateTyping();
            await client.sendMessage(msg.from, '❓ Deseja montar outro açaí?\n*Responda: SIM ou NÃO*');
            // if (!dados.comanda.listaAcais) dados.comanda.listaAcais = [];
            //     dados.comanda.listaAcais.push({
            //         sabor: dados.comanda.saborAcai,
            //         adicionais: dados.comanda.adicionais,
            //         valorExtras: dados.comanda.valorExtras
            //     });

            break;
        }
        
        case 'aguardandoLocalidade': {
            const localidade = msg.body.trim();
            dados.comanda.localidade = localidade;
            dados.comanda.valorFrete = precosFrete[localidade.toLowerCase()] || 0;
        
            await chat.sendStateTyping();
            await client.sendMessage(msg.from,
                '📌 Perfeito. Poderia me enviar a *localização atual* e me informar o *endereço direitinho* por favor?'
            );
        
            dados.etapa = 'aguardandoEndereco';
            break;
        }
        case 'aguardandoEndereco': {
            const endereco = msg.body.trim();
            dados.comanda.enderecoTexto = endereco;
        
            dados.etapa = 'formaPagamento';
            await chat.sendStateTyping();
            await client.sendMessage(msg.from,
                '💳 Como prefere pagar?\n\n1️⃣ Cartão (crédito/débito)\n2️⃣ Dinheiro (levar troco para quanto?)\n3️⃣ Pix'
            );            
            break;
        }        
        case 'perguntarOutroAcai': {
            const resposta = msg.body.trim().toLowerCase();
            if (!dados.comanda.listaAcais) dados.comanda.listaAcais = [];
        
            dados.comanda.listaAcais.push({
                sabor: dados.comanda.saborAcai,
                adicionais: dados.comanda.adicionais,
                valorExtras: dados.comanda.valorExtras
            });
        
            if (resposta === 'sim') {
                await chat.sendStateTyping();
                await client.sendMessage(msg.from,
                    '🍧 Vamos montar mais um açaí!\nQual sabor você deseja?\n- Açaí Tradicional\n- Açaí de Morango\n- Açaí de Banana'
                );
                dados.etapa = 'aguardandoSaborAcai';
                delete dados.comanda.saborAcai;
                delete dados.comanda.adicionais;
                delete dados.comanda.valorExtras;
                delete dados.comanda.adicionaisSelecionados;
            } else {
                dados.etapa = 'aguardandoFrete';
                await chat.sendStateTyping();
                await client.sendMessage(msg.from,
                    '🚚 Antes de finalizar, escolha sua *localidade* para calcularmos o frete:\n\n' +
                    '📍 *3 reais:* bom será, licurizal, buraco d’água\n' +
                    '📍 *5 reais:* lagoa velha, gazai, baixa da ema\n' +
                    '📍 *7 reais:* batista, ipoeira, pedra azul\n' +
                    '📍 *10 reais:* pindura saia, roma\n' +
                    '📍 *12 reais:* araticum\n' +
                    '📍 *15 reais:* quatro estradas, ponto, cabeça do boi\n\n' +
                    '✏️ Digite o nome da sua localidade abaixo ⬇️'
                );
            }
            break;
        }

        case 'aguardandoFrete': {
            const localidade = msg.body.trim();
            dados.comanda.localidade = localidade;
            dados.comanda.valorFrete = precosFrete[localidade.toLowerCase()] || 0;
        
            dados.etapa = 'aguardandoEndereco';
            await chat.sendStateTyping();
            await client.sendMessage(msg.from,
                '📌 Perfeito. Poderia me enviar a *localização atual* e me informar o *endereço direitinho* por favor?'
            );
            break;
        }

        case 'formaPagamento': {
            const forma = msg.body.trim().toLowerCase();
            if (forma.includes('cartao') || forma === '1' || forma.includes('cartão')) {
                dados.etapa = 'tipoCartao';
                await chat.sendStateTyping();
                await client.sendMessage(msg.from, '📌 No cartão tem uma pequena taxa da maquininha, ok?');
                await delay(1000);
                await client.sendMessage(msg.from, 'Me confirma uma coisa. Vai ser no *Crédito* ou *Débito*?');
            } else if (forma.includes('dinheiro') || forma === '2') {
                dados.etapa = 'trocoDinheiro';
                await client.sendMessage(msg.from, '💵 Certo! Precisa de troco pra quanto?');
            } else if (forma.includes('pix') || forma === '3') {
                dados.comanda.pagamento = 'Pix';
                await chat.sendStateTyping();
                await client.sendMessage(msg.from, '📲 Chave Pix:\n*75974003081*\n*Iran Lima Silva*');
            
                dados.etapa = 'resumoFinal';
                client.emit('message', msg); // forçar envio do resumo
            } else {
                await client.sendMessage(msg.from, '❌ Opção inválida. Escolha:\n1️⃣ Cartão\n2️⃣ Dinheiro\n3️⃣ Pix');
            }
            break;
        }
        
        case 'tipoCartao': {
            const tipo = msg.body.trim().toLowerCase();
            const somaExtras = dados.comanda.listaAcais.reduce((acc, item) => acc + item.valorExtras, 0);
            const valorComFrete = somaExtras + dados.comanda.valorFrete;
        
            if (tipo.includes('débito') || tipo.includes('debito')) {
                const taxa = valorComFrete * (TAXA_DEBITO / 100);
                dados.comanda.pagamento = 'Cartão (Débito)';
                dados.comanda.taxaCartao = taxa;
            } else if (tipo.includes('crédito') || tipo.includes('credito')) {
                const taxa = valorComFrete * (TAXA_CREDITO / 100);
                dados.comanda.pagamento = 'Cartão (Crédito)';
                dados.comanda.taxaCartao = taxa;
            } else {
                await client.sendMessage(msg.from, '❌ Por favor, diga se é *Crédito* ou *Débito*.');
                return;
            }
        
            dados.etapa = 'resumoFinal';
            client.emit('message', msg);
            break;
        }
        
        case 'trocoDinheiro': {
            const valor = msg.body.trim();
            dados.comanda.pagamento = `Dinheiro - Troco para R$ ${valor}`;
            dados.etapa = 'resumoFinal';
            client.emit('message', msg);
            break;
        }
        
        case 'resumoFinal': {
            const now = new Date();
            const dia = now.toLocaleDateString('pt-BR');
            const hora = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
            let resumo = `⭐ *RESUMO DE PEDIDO* ⭐\n\n`;
            resumo += `*Nome:* ${dados.nome}\n\n`;
            resumo += `*Pedido:*\n`;
        
            let totalExtras = 0;
            dados.comanda.listaAcais.forEach((item, i) => {
                resumo += `${i + 1}. AÇAÍ - ${item.sabor}\n   ➕ Adicionais: ${item.adicionais.join(', ')}\n`;
                totalExtras += item.valorExtras;
                if (item.valorExtras > 0) {
                    resumo += `   💰 Adicionais pagos: R$ ${item.valorExtras.toFixed(2)}\n`;
                }
            });
        
            const frete = dados.comanda.valorFrete || 0;
            const taxa = dados.comanda.taxaCartao || 0;
            const valorAcais = dados.comanda.listaAcais.length * VALOR_ACAI;
            const total = valorAcais + totalExtras + frete + taxa;
        
            resumo += `${dados.comanda.listaAcais.length + 1}. FRETE R$ ${frete.toFixed(2)}\n`;
            resumo += `---------------------------\n\n`;
        
            resumo += `*Valor Total a pagar:* R$ ${total.toFixed(2)}\n`;
            resumo += `====================\n\n`;
        
            resumo += `🛵 *Com Entrega*\n`;
            resumo += `===== *Endereço* =====\n`;
            resumo += `${dados.comanda.localidade}, ${dados.comanda.enderecoTexto}\n`;
            resumo += `====================\n\n`;
        
            resumo += `💳 *Forma de Pagamento:* ${dados.comanda.pagamento || 'Não informado'}\n`;
            if (dados.comanda.pagamento?.toLowerCase().includes('troco')) {
                const match = dados.comanda.pagamento.match(/R\$\s?\d+(?:,\d{2})?/);
                if (match) resumo += `💲 *Levar Troco Pra:* ${match[0]}\n`;
            }
        
            resumo += `\n---------------------------\n`;
            resumo += `*Pedido realizado em:*\n${dia} | ${hora}\n\n`;
            resumo += `😊 *Agradecemos a Preferência!!*`;
        
            await chat.sendStateTyping();
            await client.sendMessage(msg.from, resumo);
            delete aguardandoSenha[msg.from];
            break;
        }
        
        
        
    }
});
