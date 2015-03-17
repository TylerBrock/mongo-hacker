hacks = $(wildcard hacks/*.js)
base = base.js
config = config.js

all: mongo_hacker.js

mongo_hacker.js: ${config} ${base} ${hacks}
	cat $^ > $@
	@echo ""
	@echo 'Run "make install" to replace your ~/.mongorc.js file:'
	@ls -la ~/.mongorc.js

install:
	@echo "INSTALLATION"
	@echo "Linking MongoHacker to .mongorc.js in your home directory:"

	@if [ -f ~/.mongorc.js ] && [ ! -f ~/.mongorc.js.orig ]; then \
		mv ~/.mongorc.js ~/.mongorc.js.orig ; \
		echo "Backed up ~/.mongorc.js.orig" ; \
	fi

	ln -sf "$(CURDIR)/mongo_hacker.js" ~/.mongorc.js

clean:
	rm "$(CURDIR)/mongo_hacker.js"

uninstall:
	rm -f ~/.mongorc.js
	-mv ~/.mongorc.js.orig ~/.mongorc.js
