from fastapi import Query


class PaginationParams:
    def __init__(
        self,
        skip: int = Query(0, ge=0, description="Cuántos registros saltarse (para la página anterior)"),
        limit: int = Query(50, ge=1, le=200, description="Cuántos registros devolver (máximo 200)"),
    ):
        self.skip = skip
        self.limit = limit
