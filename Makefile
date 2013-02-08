install:
	@echo "INSTALLATION"
	@echo "Linking MongoHacker to .mongorc.js in your home directory:"
	rm -f ~/.mongorc.js && ln -sf $(CURDIR) ~/.mongorc.js
