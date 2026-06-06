export declare class PagBankClient {
    private readonly baseUrl;
    private readonly token;
    constructor(token: string, sandbox: boolean);
    private headers;
    private request;
    criarOrdemPix(params: {
        reference_id: string;
        valor_centavos: number;
        customer: {
            name: string;
            email: string;
            tax_id: string;
        };
        itens: {
            name: string;
            quantity: number;
            unit_amount: number;
        }[];
        webhook_url: string;
    }): Promise<any>;
    criarOrdemCartao(params: {
        reference_id: string;
        valor_centavos: number;
        customer: {
            name: string;
            email: string;
            tax_id: string;
        };
        itens: {
            name: string;
            quantity: number;
            unit_amount: number;
        }[];
        card_encrypted: string;
        parcelas: number;
        tipo: 'CREDIT_CARD' | 'DEBIT_CARD';
        webhook_url: string;
    }): Promise<any>;
    buscarOrdem(pagbankOrderId: string): Promise<any>;
}
