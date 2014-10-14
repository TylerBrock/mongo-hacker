hacks = $(wildcard hacks/*.js)
base = base.js
config = config.js

all: mongo_hacker.js install

mongo_hacker.js: ${base} ${config} ${hacks}
	cat $^ > $@

install:
	@echo "INSTALLATION"
	@echo "Linking MongoHacker to .mongorc.js in your home directory:"

	@if [ -f ~/.mongorc.js ] && [ ! -f ~/.mongorc.js.orig ] ; then mv ~/.mongorc.js ~/.mongorc.js.orig ; echo "Backed up ~/.mongorc.js.orig" ; fi

	ln -sf "$(CURDIR)/mongo_hacker.js" ~/.mongorc.js

uninstall:
	rm -f ~/.mongorc.js

