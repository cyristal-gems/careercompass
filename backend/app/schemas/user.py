from typing import Annotated
from pydantic import EmailStr, Field
from app.schemas.records import Input, Output


class Credentials(Input):
    email: EmailStr
    password: Annotated[str, Field(min_length=12, max_length=128)]


class Register(Credentials):
    first_name: Annotated[str, Field(min_length=1, max_length=80)]


class UserOut(Output):
    id: str
    email: str
    first_name: str


class ResetRequest(Input):
    email: EmailStr


class ResetConfirm(Input):
    token: Annotated[str, Field(min_length=32, max_length=200)]
    password: Annotated[str, Field(min_length=12, max_length=128)]


class ProfilePatch(Input):
    first_name: Annotated[str, Field(min_length=1, max_length=80)]
