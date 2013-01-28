install:
	@echo "INSTALLATION"
	@echo "... Link mongo_hacker.js to .mongorc.js in your home directory:"
	rm -f ~/.mongorc.js && ln -sf $(CURDIR)/mongo_hacker.js ~/.mongorc.js
