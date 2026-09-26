-- Páginas legais (Termos de Uso, Política de Privacidade) editáveis pelo
-- admin em /admin/paginas-legais — conteúdo em texto simples com uma marcação
-- leve (linhas começando com '## ' viram título de seção, linhas com '- '
-- viram item de lista, linha em branco separa parágrafos), parseada no
-- frontend por src/utils/paginaLegal.js. Conteúdo inicial migrado do que foi
-- redigido nesta sessão (ver HOMOLOGACAO/termos_de_uso_pediuvai_20260926.txt
-- e politica_privacidade_pediuvai_20260926.txt) — precisa que o admin
-- preencha razão social/CNPJ/endereço/foro (campos [ENTRE COLCHETES]) antes
-- de considerar o texto pronto para publicação.
CREATE TABLE public.paginas_legais (
  slug TEXT PRIMARY KEY CHECK (slug IN ('termos-de-uso', 'politica-privacidade')),
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_por UUID REFERENCES auth.users(id)
);

ALTER TABLE public.paginas_legais ENABLE ROW LEVEL SECURITY;

-- Acesso real é sempre via backend com service_role — RLS aqui é defesa em
-- profundidade, mesma convenção de academia_videos/customer_addresses.
CREATE POLICY "leitura_publica" ON public.paginas_legais
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "admin_gerencia" ON public.paginas_legais
  FOR ALL TO authenticated USING (public.is_admin());

INSERT INTO public.paginas_legais (slug, titulo, conteudo) VALUES
('termos-de-uso', 'Termos de Uso', $txt1$Última atualização: 26 de setembro de 2026

Estes Termos de Uso ("Termos") regulam o acesso e uso da plataforma PediuVai (site, aplicativos e demais serviços associados, doravante "Plataforma"), operada por [RAZÃO SOCIAL DA EMPRESA], inscrita no CNPJ sob o nº [CNPJ], com sede em [ENDEREÇO COMPLETO, CIDADE/UF] ("PediuVai", "nós"). Ao criar uma conta, acessar ou utilizar a Plataforma, você ("Usuário") declara ter lido, compreendido e aceitado integralmente estes Termos e a nossa Política de Privacidade. Se você não concorda com qualquer disposição aqui prevista, não utilize a Plataforma.

## 1. O que é a PediuVai

A PediuVai é uma plataforma digital de intermediação que conecta, em um único ambiente, (a) consumidores finais ("Clientes"), (b) restaurantes, mercados, farmácias, lojas e prestadores de serviço independentes que oferecem seus produtos e serviços através da Plataforma ("Estabelecimentos Parceiros") e (c) entregadores autônomos que realizam a coleta e entrega dos pedidos ("Entregadores Parceiros").

A PediuVai não produz, não vende, não fabrica, não manipula, não estoca e não presta, ela mesma, os produtos ou serviços anunciados pelos Estabelecimentos Parceiros, tampouco realiza, ela mesma, o transporte ou entrega dos pedidos. A atuação da PediuVai se limita a: disponibilizar a tecnologia, o ambiente digital, o processamento de pedidos, a intermediação de pagamentos (por meio de parceiros processadores) e o suporte necessário para viabilizar a relação comercial entre Clientes, Estabelecimentos Parceiros e Entregadores Parceiros, mediante cobrança de comissão e/ou taxa de serviço pela intermediação, conforme detalhado na Seção 7.

## 2. Natureza jurídica dos vínculos — ausência de vínculo empregatício, societário ou de representação

Este é um ponto central destes Termos e deve ser lido com atenção por todos os perfis de Usuário.

- A PediuVai não possui e não pretende possuir qualquer vínculo empregatício, de subordinação, de exclusividade, associativo, societário, de representação comercial ou de franquia com Clientes, Estabelecimentos Parceiros ou Entregadores Parceiros.
- Os Estabelecimentos Parceiros são pessoas físicas ou jurídicas independentes, que operam seus próprios negócios, definem seus próprios preços, cardápios, políticas comerciais e são exclusivamente responsáveis por suas obrigações fiscais, trabalhistas, sanitárias e regulatórias. A PediuVai não é sócia, coligada, controladora, controlada ou associada de nenhum Estabelecimento Parceiro, ainda que a Plataforma seja disponibilizada em modelo "white label" (marca própria de cada Estabelecimento Parceiro).
- Os Entregadores Parceiros prestam serviços de transporte e entrega na qualidade de profissionais autônomos ou pessoas jurídicas próprias (MEI ou similar), sem qualquer relação de emprego, subordinação jurídica, habitualidade obrigatória ou exclusividade com a PediuVai ou com os Estabelecimentos Parceiros. O Entregador Parceiro define livremente seus horários de disponibilidade, tem liberdade para aceitar ou recusar corridas oferecidas e é responsável por seu próprio veículo, equipamentos, documentação, tributos e eventuais seguros.
- Nenhuma disposição destes Termos, nenhuma funcionalidade da Plataforma (incluindo geolocalização, atribuição automática de pedidos, avaliações ou metas de desempenho) e nenhuma prática adotada no dia a dia da operação deve ser interpretada como criadora de vínculo empregatício, relação de consumo entre a PediuVai e os Estabelecimentos/Entregadores Parceiros, ou qualquer outra relação jurídica distinta da relação de parceria comercial e intermediação aqui descrita.
- Cabe a cada Estabelecimento Parceiro e a cada Entregador Parceiro, com exclusividade, o cumprimento de suas próprias obrigações legais (trabalhistas, previdenciárias, tributárias, sanitárias, de trânsito, consumeristas quanto ao produto vendido, entre outras), não podendo tais obrigações ser atribuídas à PediuVai em nenhuma hipótese decorrente unicamente do uso da Plataforma.

## 3. Cadastro e elegibilidade

Para utilizar a Plataforma, o Usuário deve ter, no mínimo, 18 (dezoito) anos completos e capacidade civil plena, ou, alternativamente, ser representado/assistido por seu responsável legal nos casos e limites admitidos em lei. Ao se cadastrar, o Usuário se compromete a fornecer informações verdadeiras, completas e atualizadas, sendo o único responsável pela veracidade dos dados informados e pela guarda de suas credenciais de acesso (login e senha), não devendo compartilhá-las com terceiros. A PediuVai pode, a seu critério, exigir verificações adicionais de identidade, documentos (CPF, CNPJ, CNH, comprovante de endereço, entre outros) antes de liberar determinadas funcionalidades, especialmente para Estabelecimentos Parceiros e Entregadores Parceiros.

## 4. Cadastro de Estabelecimentos Parceiros

O cadastro como Estabelecimento Parceiro pressupõe que o interessado possui CNPJ ativo (ou registro equivalente permitido) e está regularmente habilitado, nos termos da legislação aplicável, para comercializar os produtos ou serviços que pretende anunciar na Plataforma (incluindo, quando aplicável, alvarás sanitários, licenças municipais, registros junto a órgãos de classe, entre outros). O Estabelecimento Parceiro é o único responsável perante os Clientes e perante quaisquer autoridades por: (a) a qualidade, segurança, composição, validade e conformidade regulatória dos produtos e serviços oferecidos; (b) a exatidão de preços, descrições, fotos e informações nutricionais/alergênicas; (c) a emissão do documento fiscal correspondente à venda do produto/serviço ao Cliente; e (d) o cumprimento do Código de Defesa do Consumidor no que se refere ao produto ou serviço vendido.

## 5. Cadastro de Entregadores Parceiros

O cadastro como Entregador Parceiro exige o fornecimento de documentação pessoal e, quando aplicável, do veículo utilizado (CNH, CRLV, CNPJ/MEI, comprovantes de regularidade), sendo de responsabilidade exclusiva do Entregador Parceiro manter tal documentação válida, bem como qualquer seguro, manutenção e regularidade fiscal referente à sua atividade. O Entregador Parceiro atua com total autonomia na execução das entregas, podendo aceitar ou recusar corridas oferecidas pela Plataforma, sem que a recusa gere, por si só, penalidade que descaracterize sua autonomia.

## 6. Papel de intermediação e responsabilidades de cada parte

A PediuVai atua como intermediária tecnológica entre Clientes, Estabelecimentos Parceiros e Entregadores Parceiros, empenhando-se para manter a Plataforma disponível, segura e funcional, e para oferecer canais adequados de atendimento e mediação de conflitos. Especificamente:

- Qualidade, quantidade, validade, temperatura, embalagem e conformidade do produto ou serviço entregue são de responsabilidade do Estabelecimento Parceiro que o vendeu.
- Atrasos, extravios, avarias ou condutas do Entregador Parceiro durante a coleta/transporte/entrega são de responsabilidade primária do próprio Entregador Parceiro, ressalvadas as hipóteses em que a legislação de consumo atribua responsabilidade solidária ao intermediário por falha comprovada na prestação de sua própria atividade de intermediação (por exemplo, defeito comprovado no sistema de atribuição de pedidos da própria Plataforma).
- A PediuVai não garante disponibilidade ininterrupta da Plataforma, tempo de entrega exato ou disponibilidade permanente de Entregadores Parceiros em qualquer região ou horário, embora empregue esforços comercialmente razoáveis para o bom funcionamento do serviço.
- Diante de reclamações de Clientes sobre pedidos, a PediuVai atuará como canal de mediação entre as partes envolvidas, podendo, a seu exclusivo critério e sem que isso configure reconhecimento de responsabilidade ou renúncia às disposições desta Seção, conceder créditos, reembolsos parciais/totais ou outras compensações como cortesia comercial, sem que isso crie precedente vinculante para casos futuros.
- Nada nesta Seção exclui responsabilidades que sejam consideradas indisponíveis, abusivas ou nulas nos termos do Código de Defesa do Consumidor (Lei nº 8.078/1990) ou de outra norma cogente aplicável; em caso de conflito entre esta Seção e norma legal imperativa, prevalece a norma legal.

## 7. Pagamentos, comissões e taxas de serviço

Os pagamentos realizados na Plataforma são processados por instituições parceiras especializadas em meios de pagamento (atualmente, Stripe e/ou PagBank/PagSeguro, podendo essa lista ser alterada), que possuem suas próprias políticas de privacidade e termos de uso. A PediuVai não armazena dados completos de cartão de crédito/débito em seus próprios servidores — esses dados são criptografados e tratados diretamente pelas processadoras de pagamento.

Pela disponibilização da Plataforma e da intermediação entre as partes, a PediuVai cobra comissão sobre as vendas realizadas pelos Estabelecimentos Parceiros e/ou taxa de serviço cobrada do Cliente, conforme o plano contratado e as condições comerciais vigentes, informadas previamente ao Estabelecimento Parceiro no momento da contratação e ao Cliente antes da finalização do pedido. Valores referentes a frete/entrega, quando cobrados, destinam-se integralmente ao Entregador Parceiro responsável pela corrida, salvo disposição diversa expressamente informada.

## 8. Cancelamentos, reembolsos e disputas

Cada Estabelecimento Parceiro possui sua própria política de cancelamento e reembolso, que deve ser compatível com o Código de Defesa do Consumidor. A PediuVai disponibiliza canal para abertura de disputas e, quando cabível, auxilia na mediação entre Cliente, Estabelecimento Parceiro e/ou Entregador Parceiro, podendo intermediar o estorno de valores junto às processadoras de pagamento, observados os prazos e regras destas.

## 9. Conduta do Usuário

Ao utilizar a Plataforma, o Usuário compromete-se a não: (a) fornecer informações falsas ou se passar por terceiros; (b) utilizar a Plataforma para fins ilícitos, fraudulentos ou para praticar assédio, discriminação ou ameaça contra outros Usuários, Estabelecimentos Parceiros, Entregadores Parceiros ou colaboradores da PediuVai; (c) realizar pedidos com o único intuito de prejudicar Estabelecimentos ou Entregadores Parceiros (incluindo estornos/chargebacks indevidos após recebimento do produto); (d) tentar acessar indevidamente sistemas, dados de terceiros ou vulnerabilidades da Plataforma; (e) publicar avaliações ou conteúdos falsos, difamatórios ou que violem direitos de terceiros.

O descumprimento desta Seção pode acarretar advertência, suspensão temporária ou encerramento definitivo da conta, sem prejuízo de outras medidas cabíveis.

## 10. Propriedade intelectual

A marca "PediuVai", seu logotipo, layout, código-fonte, funcionalidades e demais elementos da Plataforma são de titularidade da PediuVai ou de seus licenciadores, protegidos pela legislação de propriedade intelectual aplicável, sendo vedada sua reprodução, engenharia reversa ou uso não autorizado. Conteúdos enviados por Usuários (fotos, avaliações, comentários) permanecem de titularidade de quem os enviou, mas o Usuário concede à PediuVai licença não exclusiva, gratuita e mundial para exibir, reproduzir e adaptar esse conteúdo dentro da própria Plataforma, para fins de operação e divulgação do serviço.

## 11. Avaliações e conteúdo gerado pelo usuário

Avaliações e comentários devem refletir experiências reais e legítimas. A PediuVai pode, a seu critério, remover conteúdos que violem estes Termos, a lei aplicável ou direitos de terceiros, sem que isso configure censura prévia ou obrigação de moderação editorial ampla.

## 12. Privacidade e proteção de dados

O tratamento de dados pessoais realizado pela PediuVai está descrito em detalhes em nossa Política de Privacidade, parte integrante destes Termos, elaborada em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).

## 13. Suspensão e encerramento de conta

A PediuVai pode suspender ou encerrar, a qualquer tempo, o acesso de um Usuário que descumpra estes Termos, pratique fraude, coloque em risco a segurança da Plataforma ou de terceiros, ou por determinação legal/judicial. O Usuário pode encerrar sua própria conta a qualquer momento, mediante solicitação pelos canais de atendimento, respeitadas obrigações pendentes (pedidos em andamento, valores devidos, obrigações fiscais).

## 14. Limitação de responsabilidade

Na máxima extensão permitida pela legislação aplicável, e sem prejuízo das responsabilidades atribuídas na Seção 6, a PediuVai não será responsável por danos indiretos, lucros cessantes, perda de dados ou danos decorrentes de: (a) uso indevido da Plataforma pelo Usuário; (b) atos exclusivos de Estabelecimentos Parceiros ou Entregadores Parceiros, que são profissionais autônomos e independentes conforme Seção 2; (c) indisponibilidade temporária da Plataforma por manutenção, falha de terceiros (provedores de internet, nuvem, processadoras de pagamento) ou motivo de força maior; (d) decisões comerciais próprias de cada Estabelecimento Parceiro (preços, cardápio, políticas de cancelamento). Nada nesta Seção afasta direitos e garantias que a lei considere irrenunciáveis, especialmente em relações de consumo.

## 15. Indenização

O Usuário concorda em indenizar e manter a PediuVai indene de quaisquer reclamações, danos ou despesas (incluindo honorários advocatícios razoáveis) decorrentes de descumprimento destes Termos, uso indevido da Plataforma ou violação de direitos de terceiros pelo próprio Usuário.

## 16. Alterações destes Termos

A PediuVai pode alterar estes Termos a qualquer tempo, mediante aviso na própria Plataforma e/ou por e-mail, com indicação da data da nova versão. O uso continuado da Plataforma após a entrada em vigor das alterações implica concordância com os novos termos; caso o Usuário não concorde, deve cessar o uso da Plataforma e, se desejar, encerrar sua conta.

## 17. Disposições gerais

Caso qualquer disposição destes Termos seja considerada nula ou inaplicável, as demais disposições permanecem plenamente válidas. A tolerância quanto ao eventual descumprimento de qualquer cláusula não implica renúncia ao direito de exigi-la posteriormente. Estes Termos não podem ser cedidos pelo Usuário sem prévia anuência da PediuVai, podendo a PediuVai cedê-los livremente no contexto de reorganização societária, fusão ou venda de ativos, mediante aviso prévio.

## 18. Lei aplicável e foro

Estes Termos são regidos pelas leis da República Federativa do Brasil. Para relações de consumo (Clientes pessoa física consumidora), fica eleito o foro do domicílio do consumidor, na forma do artigo 101, inciso I, do Código de Defesa do Consumidor, sem prejuízo de foro mais favorável ao consumidor previsto em lei. Para as demais relações (Estabelecimentos Parceiros e Entregadores Parceiros, na qualidade de parceiros comerciais autônomos), fica eleito o foro da comarca de [CIDADE/UF], com renúncia a qualquer outro, por mais privilegiado que seja.

## 19. Contato

Dúvidas, solicitações ou reclamações podem ser encaminhadas para contato@pediuvai.com.br.$txt1$),
('politica-privacidade', 'Política de Privacidade', $txt2$Última atualização: 26 de setembro de 2026

Esta Política de Privacidade descreve como a PediuVai, operada por [RAZÃO SOCIAL DA EMPRESA], inscrita no CNPJ sob o nº [CNPJ], com sede em [ENDEREÇO COMPLETO, CIDADE/UF] ("PediuVai", "nós"), na qualidade de controladora de dados pessoais, coleta, usa, compartilha, armazena e protege os dados pessoais de Clientes, Estabelecimentos Parceiros e Entregadores Parceiros ("Titulares") que utilizam a plataforma PediuVai ("Plataforma"), em conformidade com a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados Pessoais — LGPD) e demais normas aplicáveis.

## 1. Quem é o controlador dos dados

A controladora dos dados pessoais tratados na Plataforma é [RAZÃO SOCIAL DA EMPRESA], CNPJ [CNPJ]. Dúvidas sobre este documento ou sobre o tratamento de dados pessoais podem ser encaminhadas para privacidade@pediuvai.com.br.

## 2. Quais dados coletamos

Coletamos diferentes categorias de dados, a depender do seu perfil de uso da Plataforma:

- Dados de todos os Usuários: nome completo, e-mail, telefone, senha (armazenada de forma criptografada), foto de perfil (opcional), endereço IP, identificadores de dispositivo e dados de navegação/uso da Plataforma.
- Dados de Clientes: endereço(s) de entrega, CPF (quando informado, para emissão de nota fiscal ou identificação em pagamentos), histórico de pedidos, avaliações e preferências, geolocalização no momento do pedido (para cálculo de frete e acompanhamento da entrega), dados necessários ao processamento de pagamento (tratados majoritariamente pelas processadoras parceiras — ver Seção 5).
- Dados de Estabelecimentos Parceiros: CNPJ, razão social, endereço comercial, dados bancários/de recebimento, documentos societários quando exigidos, dados de contato dos responsáveis.
- Dados de Entregadores Parceiros: CPF/CNPJ, CNH e dados do veículo, documentos comprobatórios de regularidade, geolocalização em tempo real durante o período em que estiver com o aplicativo ativo para realizar entregas (necessária para atribuição de corridas e acompanhamento da entrega pelo Cliente e pelo Estabelecimento Parceiro).
- Cookies e tecnologias semelhantes: ver Seção 7.

## 3. Para que usamos seus dados (finalidades e bases legais)

Tratamos dados pessoais com fundamento nas seguintes bases legais previstas no artigo 7º da LGPD, conforme a finalidade:

- Execução de contrato ou de procedimentos preliminares (art. 7º, V): criar e gerenciar sua conta, processar pedidos, calcular fretes, viabilizar a comunicação entre Cliente, Estabelecimento Parceiro e Entregador Parceiro, processar pagamentos.
- Cumprimento de obrigação legal ou regulatória (art. 7º, II): emissão de documentos fiscais relativos ao nosso próprio serviço de intermediação, atendimento a determinações de autoridades fiscais, policiais ou judiciais, prevenção à lavagem de dinheiro exigida por processadoras de pagamento.
- Legítimo interesse (art. 7º, IX): prevenção a fraudes, segurança da Plataforma, melhoria de produtos e funcionalidades, elaboração de estatísticas agregadas e anonimizadas.
- Consentimento (art. 7º, I): envio de comunicações de marketing e promoções, uso de cookies não essenciais/analytics, quando aplicável — sempre com opção de recusa/revogação a qualquer momento.

## 4. Com quem compartilhamos seus dados

O compartilhamento de dados é limitado ao necessário para viabilizar o funcionamento da Plataforma, e não implica, em nenhuma hipótese, vínculo societário, de representação ou subsidiariedade entre a PediuVai e os destinatários abaixo:

- Estabelecimentos Parceiros: recebem os dados do pedido e os dados de contato/endereço do Cliente estritamente necessários para preparar e entregar o pedido.
- Entregadores Parceiros: recebem nome, telefone e endereço do Cliente, e dados do Estabelecimento Parceiro, estritamente necessários para realizar a coleta e entrega.
- Processadoras de pagamento (atualmente Stripe e PagBank/PagSeguro): recebem os dados necessários para processar cobranças, sujeitos às políticas de privacidade próprias dessas empresas.
- Provedores de infraestrutura tecnológica (hospedagem, banco de dados, e-mail transacional, cache): processam dados em nosso nome, sob instruções contratuais, exclusivamente para viabilizar o funcionamento técnico da Plataforma.
- Autoridades públicas: quando exigido por lei, ordem judicial ou requisição de autoridade competente.
- Não vendemos dados pessoais a terceiros para fins de marketing de terceiros.

## 5. Pagamentos

Dados de cartão de crédito/débito são inseridos diretamente em ambiente controlado pelas processadoras de pagamento parceiras (Stripe e/ou PagBank/PagSeguro), que os criptografam e processam segundo seus próprios padrões de segurança (incluindo certificação PCI-DSS). A PediuVai não armazena números completos de cartão em seus próprios servidores.

## 6. Transferência internacional de dados

Parte da nossa infraestrutura de nuvem (banco de dados e serviços correlatos) pode estar hospedada em servidores localizados fora do Brasil, inclusive nos Estados Unidos. Nessas hipóteses, exigimos de nossos fornecedores o cumprimento de padrões de segurança e proteção de dados compatíveis com a LGPD, incluindo cláusulas contratuais adequadas, nos termos do artigo 33 da LGPD.

## 7. Cookies e tecnologias semelhantes

Utilizamos cookies essenciais para autenticação e funcionamento básico da Plataforma (por exemplo, manter sua sessão ativa), que não podem ser desativados sem prejuízo ao uso do serviço. Podemos também utilizar cookies de desempenho/analytics para entender como a Plataforma é utilizada e melhorá-la; quando aplicável, você poderá gerenciar suas preferências de cookies não essenciais nas configurações do seu navegador ou em eventual banner de consentimento exibido na Plataforma.

## 8. Segurança da informação

Adotamos medidas técnicas e administrativas razoáveis para proteger os dados pessoais, incluindo criptografia de dados em trânsito (TLS/HTTPS), armazenamento de senhas com hashing, controles de acesso baseados em função (por perfil de Usuário) e políticas de segurança em nível de banco de dados. Nenhum sistema é absolutamente imune a incidentes; caso ocorra um incidente de segurança que possa acarretar risco relevante aos Titulares, a PediuVai notificará a Autoridade Nacional de Proteção de Dados (ANPD) e os Titulares afetados, conforme exigido pelo artigo 48 da LGPD.

## 9. Por quanto tempo guardamos seus dados

Mantemos os dados pessoais pelo tempo necessário ao cumprimento das finalidades para as quais foram coletados, ou pelo prazo exigido por lei (por exemplo, obrigações fiscais e contábeis, tipicamente de até 5 anos). Encerrada a conta e ultrapassados os prazos legais de retenção, os dados são eliminados ou anonimizados, ressalvada a guarda mínima exigida por lei ou necessária ao exercício regular de direitos em processos judiciais/administrativos.

## 10. Seus direitos como titular de dados

Nos termos do artigo 18 da LGPD, você pode, a qualquer momento, solicitar: (a) confirmação da existência de tratamento; (b) acesso aos seus dados; (c) correção de dados incompletos, inexatos ou desatualizados; (d) anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados em desconformidade com a LGPD; (e) portabilidade dos dados a outro fornecedor de serviço; (f) eliminação dos dados pessoais tratados com base no seu consentimento; (g) informação sobre as entidades públicas e privadas com as quais compartilhamos seus dados; (h) informação sobre a possibilidade de não fornecer consentimento e as consequências dessa negativa; (i) revogação do consentimento; (j) revisão de decisões tomadas unicamente com base em tratamento automatizado de dados, quando aplicável.

Solicitações podem ser feitas pelo canal indicado na Seção 1 ou nas configurações da sua conta, e serão respondidas nos prazos previstos na regulamentação da ANPD.

## 11. Encarregado de proteção de dados (DPO)

O encarregado pelo tratamento de dados pessoais (DPO) da PediuVai pode ser contatado através do e-mail privacidade@pediuvai.com.br.

## 12. Menores de idade

A Plataforma não é destinada a menores de 18 anos. Caso identifiquemos cadastro realizado por menor de idade sem a devida representação/assistência legal, a conta poderá ser suspensa ou encerrada, com eliminação dos dados coletados, ressalvadas as hipóteses legais de retenção.

## 13. Alterações desta Política

Esta Política pode ser atualizada periodicamente, sempre com indicação da data da versão vigente no topo deste documento. Alterações relevantes serão comunicadas por aviso na Plataforma e/ou por e-mail. O uso continuado da Plataforma após a alteração implica ciência dos novos termos desta Política.

## 14. Contato

Dúvidas, solicitações relacionadas a dados pessoais ou reclamações podem ser encaminhadas para privacidade@pediuvai.com.br. Você também pode apresentar reclamação à Autoridade Nacional de Proteção de Dados (ANPD), caso entenda necessário.$txt2$);
