@echo off
echo Fazendo deploy do AMBI360...

echo Instalando Firebase CLI...
npm install -g firebase-tools

echo Fazendo login no Firebase...
firebase login

echo Inicializando projeto...
firebase init hosting

echo Fazendo deploy...
firebase deploy

echo Deploy concluido!
echo Seu projeto estara disponivel em: https://seu-projeto.web.app
pause