#!/bin/sh
echo "Atualizando pacotes"

# Should be changed to only "yarn install" aftewards
# Was used to use ts-node in production for now
NODE_ENV=development yarn install

echo "Inicializando a aplicação"

if [[ $NODE_ENV == 'production' ]] ; then
    yarn start:production
else
    yarn start
fi


