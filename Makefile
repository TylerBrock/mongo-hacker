hacks = $(wildcard hacks/*.js)
base = base.js
config = config.js

all: mongo_hacker.js
	@echo ""
	@echo "MONGO HACKER INSTALLATION OPTIONS"
	@echo "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"
	@echo "Note: if ~/.mongorc.js already exists it will be backed up before installation."
	@echo ""
	@echo "1) NORMAL INSTALL: Run 'make install' to copy to '~/.mongorc.js'"
	@echo ""
	@echo "2) DEVELOPER MODE: Run 'make develop' to symlink to '~/.mongorc.js'"
	@echo ""
	@echo "3) UNINSTALL: Run 'make uninstall' to revert to the last backed up '~/.mongorc.js'"
	@echo ""

mongo_hacker.js: ${config} ${base} ${hacks}
	cat $^ > $@

backup_mongorc:
	@if [ -L ~/.mongorc.js ] ; then \
		rm ~/.mongorc.js; \
		echo "Removed symlinked ~/.mongorc.js" ; \
	fi

	@if [ -f ~/.mongorc.js ]; then \
		mv ~/.mongorc.js ~/.mongorc.js.$(shell date +%s); \
		ln -sf ~/.mongorc.js.$(shell date +%s) ~/.mongorc.js.orig; \
		echo "Backed up ~/.mongorc.js to ~/.mongorc.js.$(shell date +%s)"; \
	fi
	@echo ""

install: mongo_hacker.js backup_mongorc
	@echo "Copying Mongo Hacker to .mongorc.js in your home directory:"

	cp -p "$(CURDIR)/mongo_hacker.js" ~/.mongorc.js

develop: mongo_hacker.js backup_mongorc
	@echo "Linking Mongo Hacker to .mongorc.js in your home directory:"

	ln -sf "$(CURDIR)/mongo_hacker.js" ~/.mongorc.js

clean:
	rm "$(CURDIR)/mongo_hacker.js"

uninstall:
	rm -f ~/.mongorc.js
	@if [ -f ~/.mongorc.js.orig ]; then \
		mv ~/.mongorc.js.orig ~/.mongorc.js; \
	fi