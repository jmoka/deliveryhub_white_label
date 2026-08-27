from typing import List, Optional
from pydantic import BaseModel, Field, field_validator


class ClienteWebhook(BaseModel):
    nome: str
    cpf_cnpj: Optional[str] = None


class ItemWebhook(BaseModel):
    product_id: int
    descricao: str
    quantidade: float
    valor_unitario: float
    unidade: str = "UN"

    @field_validator("quantidade", "valor_unitario")
    @classmethod
    def deve_ser_positivo(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("deve ser maior que zero")
        return v


class PedidoWebhook(BaseModel):
    pedido_id: str = Field(..., description="ID unico do pedido no sistema de delivery")
    cliente: ClienteWebhook
    itens: List[ItemWebhook]

    @field_validator("itens")
    @classmethod
    def deve_ter_item(cls, v: List[ItemWebhook]) -> List[ItemWebhook]:
        if not v:
            raise ValueError("pedido sem itens")
        return v
