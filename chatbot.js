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
const precosFrete = {"bom sera": 3, "bom será": 3,"licurizal": 3,"buraco dagua": 3,"buraco d’água": 3,"lagoa velha": 5,"gazai": 5,"baixa da ema": 5,"batista": 7,"ipoeira": 7,"pedra azul": 7,"pindura saia": 10,"roma": 10,"araticum": 12,"quatro estradas": 15,"ponto": 15,"cabeça do boi": 15};
const VALOR_ACAI = 15.00;
const TAXA_DEBITO = 1.43;
const TAXA_CREDITO = 3.38;
const controleRespostas = {}; 
const TEMPO_ESPERA_MS = 90 * 60 * 1000; 

client.on('message', async msg => {
    // Verificação de horário de funcionamento
    // const agora = new Date();
    // const diaSemana = agora.getDay(); // 0 = Domingo, 1 = Segunda ... 6 = Sábado
    // const hora = agora.getHours();
    // const minuto = agora.getMinutes();

    // const horaDecimal = hora + minuto / 60;

    // let horarioValido = false;

    // if ([4, 5, 6].includes(diaSemana)) {
    //     // Quinta (4), Sexta (5), Sábado (6) → 18:30 até 22:00
    //     if (horaDecimal >= 18.5 && horaDecimal <= 22) horarioValido = true;
    // } else if ([0, 1, 2].includes(diaSemana)) {
    //     // Domingo (0), Segunda (1), Terça (2) → 18:30 até 21:00
    //     if (horaDecimal >= 18.5 && horaDecimal <= 21) horarioValido = true;
    // } else if (diaSemana === 3) {
    //     // Quarta-feira (3) → fechado
    //     horarioValido = false;
    // }

    // if (!horarioValido) {
    //     await client.sendMessage(msg.from,
    //         '⚠️ *Olá!*\nA pizzaria não está funcionando neste horário.\n\n🕒 *Horários de atendimento:*\n' +
    //         '📅 *Dom, Seg, Ter:* 18:30 às 21:00\n' +
    //         '📅 *Quarta-feira:* Fechado\n' +
    //         '📅 *Qui, Sex, Sáb:* 18:30 às 22:00\n\nTe espero no horário certo pra fazer seu pedido! 🍕😊' 
    //     );
    //     return; // Interrompe o fluxo para não continuar com o atendimento
    // }
    // const agora = Date.now();
    // const ultimoAtendimento = controleRespostas[msg.from] || 0;

    // if (agora - ultimoAtendimento < TEMPO_ESPERA_MS) {
    //     // Silencia a resposta se ainda não passou 1h30
    //     return;
    // }




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
                await client.sendMessage(msg.from,
                    `🍕 *Vamos montar seu pedido, ${dados.nome}?* 😁\n\n` +
                    `Pode me dizer, qual o tamanho da pizza você quer?\n`+
                    `🧀 *Grande (8 fatias)* - R$ 40,00\n`+
                    `🍕 *Média (6 fatias)* - R$ 35,00\n`+
                    `🌟 *Borda recheada (8 fatias)* - R$ 48,00`
                    );
                dados.etapa = 'aguardandoTamanhoPizza';
                dados.comanda = {};

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

        case 'aguardandoTamanhoPizza': {
            const tamanho = msg.body.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            let precoPizza = 0;
        
            if (tamanho.includes('media')) {
                dados.comanda.tamanhoPizza = 'Média';
                precoPizza = 35;
            } else if (tamanho.includes('grande')) {
                dados.comanda.tamanhoPizza = 'Grande';
                precoPizza = 40;
            } else if (tamanho.includes('borda')) {
                dados.comanda.tamanhoPizza = 'Borda Recheada';
                precoPizza = 48;
                dados.etapa = 'aguardandoSaborBorda'; // <- esse continua separado
                break;
            } else {
                await client.sendMessage(msg.from, '❌ Tamanho inválido. Digite *Média*, *Grande* ou *Borda Recheada*.');
                return;
            }
        
            dados.comanda.valorPizza = precoPizza;
        
            // ✅ Etapa correta para esperar sabores
            dados.etapa = 'aguardandoSaboresSelecionados';
        
            const saboresTexto = `Pronto, perfeito! Agora, qual sabores você prefere?\nLembrando, você pode escolher 2 sabores\n\n` +
                `- MUSSARELA\n` +
                `- 2 QUEIJOS\n` +
                `- 3 QUEIJOS\n` +
                `- MISTA\n` +
                `- MILHO VERDE\n` +
                `- CALABRESA\n` +
                `- CALABRESA COM CATUPIRY\n` +
                `- CALABRESA COM CHEDDAR\n` +
                `- CALABRESUNTO\n` +
                `- CALABRESA COM MILHO\n` +
                `- APIMENTADA\n` +
                `- FRANGO COM CATUPIRY\n` +
                `- FRANGO COM CHEDDAR\n` +
                `- CAIPIRA`;
        
            await chat.sendStateTyping();
            await client.sendMessage(msg.from, saboresTexto);
        
            break;
        }
        

        case 'aguardandoSaboresSelecionados': {
            const sabores = msg.body.split(',').map(s => s.trim().toUpperCase());
        
            if (sabores.length > 2) {
                await client.sendMessage(msg.from, '⚠️ Você só pode escolher *2 sabores*. Por favor, envie novamente.');
                return;
            }
        
            dados.comanda.saboresPizza = sabores;
            dados.etapa = 'perguntarMaisPizzaOuAcai';
        
            await chat.sendStateTyping();
            await client.sendMessage(msg.from,
                'Muito bom! Você deseja adicionar outra pizza ou açaí?\n\n*SIM*\n*NÃO*'
            );
            break;
        }

        case 'perguntarObservacao': {
            const resposta = msg.body.trim().toLowerCase();
        
            if (resposta === 'sim') {
                dados.etapa = 'aguardandoTextoObservacao';
                await client.sendMessage(msg.from, '✍️ Pode digitar sua observação que vou anotar aqui...');
            } else if (resposta === 'não' || resposta === 'nao') {
                dados.comanda.observacao = null;
                dados.etapa = 'perguntarBebida';
        
                await chat.sendStateTyping();
                await client.sendMessage(msg.from,
                    'Beleza! Vai querer algo para beber?\n\nTemos:\n' +
                    '- Refri Goob Guaraná 2L - 8,00\n' +
                    '- Refri Goob Cola 2L - 8,00\n' +
                    '- Refri Goob Guaraná 1L - 5,00\n' +
                    '- Não quero nada para beber'
                );
            } else {
                await client.sendMessage(msg.from, '❌ Por favor, responda apenas *SIM* ou *NÃO*.');
            }
        
            break;
        }

        case 'aguardandoTextoObservacao': {
            const obs = msg.body.trim();
            dados.comanda.observacao = obs;
        
            dados.etapa = 'perguntarBebida';
        
            await chat.sendStateTyping();
            await client.sendMessage(msg.from,
                'Beleza! Vai querer algo para beber?\n\nTemos:\n' +
                '- Refri Goob Guaraná 2L - 8,00\n' +
                '- Refri Goob Cola 2L - 8,00\n' +
                '- Refri Goob Guaraná 1L - 5,00\n' +
                '- Não quero nada para beber'
            );
        
            break;
        }

        
        case 'perguntarBebida': {
            const bebida = msg.body.trim();
            dados.comanda.bebida = bebida;
        
            dados.etapa = 'aguardandoLocalidade'; // <- Atualiza etapa corretamente
        
            // 1. Pergunta a região
            await chat.sendStateTyping();
            await client.sendMessage(msg.from,
                '📍 *Maravilha!* Me informa qual o nome da sua região para calcular o frete:\n\n' +
                '- Bom Será\n' +
                '- Licurizal\n' +
                '- Buraco d´Agua\n' +
                '- Lagoa Velha\n' +
                '- Gazai\n' +
                '- Baixa da Ema\n' +
                '- Batista\n' +
                '- Ipoeira\n' +
                '- Pindura Saia\n' +
                '- Roma\n' +
                '- Araticum\n' +
                '- Quatro Estradas\n' +
                '- Cabeça do Boi\n' +
                '- Ponto\n\n' +
                '📝 *-Prefiro fazer retirada?*\n' +
                '📝 *-Outra Região?Qual?:*'
            );
        
            break; // para aqui! só vai pro endereço no próximo case
        }
              
        

        case 'perguntarMaisPizzaOuAcai': {
            const resposta = msg.body.trim().toLowerCase();
        
            if (resposta === 'sim') {
                dados.etapa = 'aguardandoPedido';
                await chat.sendStateTyping();
                await client.sendMessage(msg.from, '😄 Vamos lá! O que você deseja adicionar agora?\n*PIZZA* ou *AÇAÍ*?');
            } else if (resposta === 'não' || resposta === 'nao') {
                dados.etapa = 'perguntarObservacao';
                await chat.sendStateTyping();
                await client.sendMessage(msg.from,
                    'Tem alguma observação?\n\n(Exemplo: frango sem catupiry, apimentada com pouca pimenta...)\n\n*Responda: SIM ou NÃO*'
                );
            } else {
                await client.sendMessage(msg.from, '❌ Por favor, responda apenas *SIM* ou *NÃO*.');
            }
            break;
        }
        
        
        
        
        // FAZER AINDA
        // case 'aguardandoSaborBorda': {
        //     const sabores = msg.body.split(',').map(s => s.trim().toUpperCase());
        //     if (sabores.length > 3) {
        //         await client.sendMessage(msg.from, '⚠️ A pizza de borda recheada permite até *3 sabores*. Tente novamente.');
        //     } else {
        //         dados.comanda.saboresPizza = sabores;
        //         dados.etapa = 'aguardandoFrete';
        //         await client.sendMessage(msg.from, '📍 Agora, informe a *sua região* para calcularmos o frete.');
        //     }
        //     break;
        // }
        
        
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
        
            dados.etapa = 'aguardandoEndereco';
        
            await chat.sendStateTyping();
            await client.sendMessage(msg.from,
                '📌 Perfeito. Poderia me enviar a *localização atual* e me informar o *endereço direitinho* por favor?'
            );
        
            break;
        }
        

        case 'aguardandoEndereco': {
            let endereco = '';
        
            if (msg.type === 'location' && msg.location) {
                const { latitude, longitude } = msg.location;
                endereco = `Localização acima!`;
            } else {
                endereco = msg.body.trim();
            }
            
            dados.comanda.enderecoTexto = endereco;
        
            // ✅ Adiciona pergunta após salvar o endereço
            dados.etapa = 'perguntarMaisPizzaOuAcai';
        
            await chat.sendStateTyping();
            await client.sendMessage(msg.from,
                '❓ Muito bom! Você deseja adicionar outra pizza ou açaí?\n\n*SIM*\n*NÃO*'
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
                    '📍 *Maravilha!* Me informa qual o nome da sua região para calcular o frete:\n\n' +
                    '- Bom Será\n' +
                    '- Licurizal\n' +
                    '- Buraco d´Agua\n' +
                    '- Lagoa Velha\n' +
                    '- Gazai\n' +
                    '- Baixa da Ema\n' +
                    '- Batista\n' +
                    '- Ipoeira\n' +
                    '- Pindura Saia\n' +
                    '- Roma\n' +
                    '- Araticum\n' +
                    '- Quatro Estradas\n' +
                    '- Cabeça do Boi\n' +
                    '- Ponto\n\n' +
                    '✏️ *-Prefiro fazer retirada?*' +
                    '✏️ *-Outra Região?Qual?:*'
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
            resumo += `*Nome:* ${dados.nome}\n\n\n`;
            resumo += `*Pedido:*\n\n`;
        
            // Agora está seguro usar +=
            if (dados.comanda.saboresPizza) {
                resumo += `🍕 *Pizza* (${dados.comanda.tamanhoPizza}) - Sabores: ${dados.comanda.saboresPizza.join(', ')}\n`;
            }
            if (dados.comanda.observacao) {
                resumo += `📝 *Obs:* ${dados.comanda.observacao}\n`;
            }
            if (dados.comanda.bebida) {
                resumo += `🥤 *Bebida:* ${dados.comanda.bebida}\n`;
            }
        
            let totalExtras = 0;
            if (dados.comanda.listaAcais) {
                dados.comanda.listaAcais.forEach((item, i) => {
                    resumo += `${i + 1}. AÇAÍ - ${item.sabor}\n`;
                    resumo += `   ➕ Adicionais: ${item.adicionais.join(', ')}\n`;
                    totalExtras += item.valorExtras;
                    if (item.valorExtras > 0) {
                        resumo += `   💰 Adicionais pagos: R$ ${item.valorExtras.toFixed(2)}\n`;
                    }
                    resumo += `\n`;
                });
            }
        
            const frete = dados.comanda.valorFrete || 0;
            const taxa = dados.comanda.taxaCartao || 0;
            const valorAcais = (dados.comanda.listaAcais?.length || 0) * VALOR_ACAI;
            const total = valorAcais + totalExtras + frete + taxa;
        
            resumo += `📦 FRETE: R$ ${frete.toFixed(2)}\n\n`;
            resumo += `-----------------------------\n\n`;
            resumo += `💰 *Valor Total a pagar:* R$ ${total.toFixed(2)}\n\n`;
            resumo += `===============================\n\n`;
            resumo += `🛵 *Com Entrega*\n\n`;
            resumo += `===== *Endereço* =====\n`;
            resumo += `${dados.comanda.localidade}, ${dados.comanda.enderecoTexto}\n\n`;
            resumo += `===============================\n\n`;
            resumo += `💳 *Forma de Pagamento:* ${dados.comanda.pagamento || 'Não informado'}\n`;
        
            if (dados.comanda.pagamento?.toLowerCase().includes('troco')) {
                const match = dados.comanda.pagamento.match(/R\$\s?\d+(?:,\d{2})?/);
                if (match) resumo += `💲 *Levar Troco Pra:* ${match[0]}\n`;
            }
        
            resumo += `\n-----------------------------\n\n`;
            resumo += `*Pedido realizado em:*\n${dia} | ${hora}\n\n`;
            resumo += `😊 *Agradecemos a Preferência!!*\n\n`;
        
            await chat.sendStateTyping();
            await client.sendMessage(msg.from, resumo);
            await client.sendMessage(msg.from, '✅ *Me confirma se está tudo certo por favor?*');
            dados.etapa = 'aguardandoConfirmacao';
            break;
        }
        

        case 'aguardandoConfirmacao': {
            const resposta = msg.body.trim().toLowerCase();
        
            // Se a pessoa confirmou
            if (resposta.includes('sim') || resposta.includes('certo')) {
                await chat.sendStateTyping();
                await client.sendMessage(msg.from, '🙏 Muito obrigado pela preferência!');
        
                // Aguarda 1h30 e envia nova mensagem
                setTimeout(async () => {
                    await client.sendMessage(msg.from, '👋 Oii, olha eu novamente!\nTudo certinho com seu pedido e a entrega?');
                }, 90 * 60 * 1000); // 90 minutos
        
                delete aguardandoSenha[msg.from];
            } else {
                // Se não confirmou
                await chat.sendStateTyping();
                await client.sendMessage(msg.from, `😥 Peço-lhe perdão *${dados.nome}*! Estarei passando para um atendente.`);
                delete aguardandoSenha[msg.from];
            }
            break;
        }        
    }
});
