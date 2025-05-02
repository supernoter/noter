# trcli

A quick way to list the ASP board on the terminal. Trello has a weird way to
give out an API key, you can manage them: https://trello.com/power-ups/admin -
also I needed to authorize the application once (using the API key):

> https://trello.com/1/authorize?expiration=never&scope=read,write,account&response_type=token&name=Supernoter&key=...

This results in a 76 char long string, that looks like this:
R9IKOL3QI2AM2HAIG7KJ2FWWVWA5JRO1905VLLFIMOZ0PTKT18FK3Y59FL4QSP207CVNHUGUOB0Z

Finally, a quick way to render a board to a terminal, including a quick summary
of the last three days.

![](../../static/trcli-demo.gif)

Refs: [chat/79da6368-24b9-4d17-bbf7-df57b0219b3b](https://claude.ai/chat/79da6368-24b9-4d17-bbf7-df57b0219b3b)
