hacks = $(wildcard hacks/*.js)
base = base.js
config = config.js

all: mongo_hacker.js install

mongo_hacker.js: ${base} ${config} ${hacks}
	cat > $@ $^

install:
	@echo "INSTALLATION"
	@echo "Linking MongoHacker to .mongorc.js in your home directory:"
	rm -f ~/.mongorc.js && ln -sf $(CURDIR)/mongo_hacker.js ~/.mongorc.js
