#!/bin/bash


OUTPUT=${1:-"VERSION-CONTROL-LOGS.pdf"}
T=$(mktemp)

S=$(mktemp).png

termshot -f "$S" -c -- git cal

echo "# VERSION CONTROL LOG ($(git rev-parse --short HEAD) - $(date))" >> $T
echo >> "$T"

cat >> "$T" <<'EOM'

> UOL CM2020 2024/25 FINAL REPORT

Generated with


```
$ date
$ git remote -v
$ git summary
$ git log --stat
```

Activity rendering generated with [git cal](https://github.com/k4rthik/git-cal).

\tiny

EOM

echo "![Activity plot, generated with [git-cal](https://github.com/k4rthik/git-cal).]($S)" >> "$T"
echo >> "$T"


echo '----' >> "$T"
echo '```' >> "$T"
date >> "$T"
echo >> "$T"

git remote -v >> "$T"
echo >> "$T"

git summary >> "$T"
echo >> "$T"

git log --stat >> "$T"
echo '```' >> "$T"

pandoc --template eisvogel -f markdown -t latex -o "$OUTPUT" "$T"
rm -f "$T"

