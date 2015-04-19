for i in *.tmx; do egrep "^[0-9]+," $i > `basename $i .tmx`.csv
done

