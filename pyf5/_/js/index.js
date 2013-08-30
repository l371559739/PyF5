// Generated by CoffeeScript 1.6.3
(function() {
  var FileModel, FolderSegment, ProjectModel, ViewModel, joinPath,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    _this = this;

  joinPath = function(p1, p2) {
    var path;
    path = [p1, p2].join('/');
    return path = path.replace(/\/+/g, '/');
  };

  FileModel = function(data, project) {
    var _this = this;
    this.name = ko.observable(data['name']);
    this.type = ko.observable(data['type']);
    this.absolutePath = ko.observable(data['absolutePath']);
    this.relativePath = ko.computed(function() {
      var relPath;
      relPath = _this.absolutePath().replace(project.path(), '');
      if (relPath && relPath[0] === '/') {
        return relPath = relPath.substr(1);
      }
    });
    this.url = ko.computed(function() {
      return "http://" + (project.root.host()) + "/" + (_this.relativePath());
    });
    this.QRurl = ko.computed(function() {
      return "http://" + (project.QRhost()) + "/" + (_this.relativePath());
    });
    this.isMuted = ko.computed(function() {
      var mutePath, _i, _len, _ref;
      if (!project.muteList().length) {
        return false;
      }
      _ref = project.muteList();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        mutePath = _ref[_i];
        if (_this.absolutePath() === joinPath(project.path(), mutePath)) {
          return true;
        }
      }
      return false;
    });
    this.mute = function() {
      var _ref;
      if (_ref = _this.relativePath(), __indexOf.call(project.muteList(), _ref) < 0) {
        project.muteList.push(_this.relativePath());
        return project.save();
      }
    };
    this.unmute = function() {
      var _ref;
      if (_ref = _this.relativePath(), __indexOf.call(project.muteList(), _ref) >= 0) {
        project.muteList.remove(_this.relativePath());
        return project.save();
      }
    };
    this.onClick = function() {
      if (_this.type() === 'DIR') {
        project.currentFolder(_this.relativePath());
        return false;
      }
      return true;
    };
    return this;
  };

  FolderSegment = function(name, relativePath, project) {
    var _this = this;
    this.name = ko.observable(name);
    this.relativePath = ko.observable(relativePath);
    this.onClick = function() {
      return project.currentFolder(_this.relativePath());
    };
    return this;
  };

  ProjectModel = function(data, root) {
    var _this = this;
    this.root = root;
    this.path = ko.observable("");
    this.active = ko.observable(false);
    this.active.subscribe(function(newValue) {
      var project, _i, _len, _ref;
      console.log(_this.path(), 'active', newValue);
      if (newValue === true) {
        _ref = root.projects();
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          project = _ref[_i];
          if (project !== _this && project.active()) {
            project.active(false);
          }
        }
        if (!_this.files().length) {
          return _this.currentFolder('');
        }
      }
    });
    this.muteList = ko.observableArray([]);
    this.targetHost = ko.observable('');
    this.QRhost = ko.observable(location.host);
    this.compileLess = ko.observable(false);
    this.compileCoffee = ko.observable(false);
    this.delay = ko.observable(0.0);
    this.delay.subscribe(function(newValue) {
      if (parseFloat(newValue) !== newValue) {
        _this.delay(parseFloat(newValue));
        return _this.save();
      }
    });
    this.showSettings = ko.observable($.cookie('hideSettings') !== 'true');
    this.showSettings.subscribe(function(newValue) {
      return $.cookie('hideSettings', !newValue);
    });
    this.submitTargetHost = function(item, event) {
      var targetHost;
      targetHost = $.trim($('#target-host-input').val());
      if (!targetHost) {
        return _this.clearTargetHost();
      } else if (/^[\w\.:\-]+$/.exec(targetHost)) {
        _this.targetHost(targetHost);
        return _this.save();
      } else {
        alert("请输入域名或ip地址（不带协议和路径）和端口，如：\n127.0.0.1:8080\n192.168.0.101\ndomain.com:8080\nmysite.com");
        return $('#target-host-input').val(targetHost).focus().select();
      }
    };
    this.clearTargetHost = function(item, event) {
      _this.targetHost("");
      $('#target-host-input').val("");
      return _this.save();
    };
    this.files = ko.observableArray([]);
    this.folderSegments = ko.observableArray([]);
    this.currentFolder = ko.observable('');
    this.currentFolder.subscribe(function(relativePath) {
      var part, parts, relativeParts, _i, _len;
      if (_this.active()) {
        _this.folderSegments.removeAll();
        parts = relativePath.split('/');
        relativeParts = [];
        for (_i = 0, _len = parts.length; _i < _len; _i++) {
          part = parts[_i];
          relativeParts.push(part);
          if (part) {
            _this.folderSegments.push(new FolderSegment(part, relativeParts.join('/'), _this));
          }
        }
        return _this.queryFileList(joinPath(_this.path(), relativePath));
      }
    });
    this.currentFolder.extend({
      notify: 'always'
    });
    this.goRoot = function() {
      return this.currentFolder('');
    };
    this.queryFileList = function(path) {
      var _this = this;
      this.files.removeAll();
      return API.os.listDir(path, function(data) {
        var fileData, _i, _len, _ref;
        _this.files.removeAll();
        _ref = data['list'];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          fileData = _ref[_i];
          _this.files.push(new FileModel(fileData, _this));
        }
        return $('.file-list td.op a').tooltip();
      });
    };
    this.QRhost.subscribe(function(newValue) {
      return setTimeout(function() {
        return _this.updateQRCode($('#qrurl-input').val());
      }, 100);
    });
    this.QRCodeFile = ko.observable(null);
    this.QRCodeFile.extend({
      notify: 'always'
    });
    this.QRCodeFile.subscribe(function(newValue) {
      if (newValue) {
        $('#qrcode-modal').modal();
        return _this.updateQRCode(newValue.QRurl());
      }
    });
    this.QRUrlChange = function(item, event) {
      return _this.updateQRCode($('#qrurl-input').val());
    };
    this.updateQRCode = function(text) {
      var $el;
      $el = $('#qrcode');
      return $el.empty().qrcode({
        width: $el.width(),
        height: $el.height(),
        text: text
      });
    };
    this.showQRCode = function(item, event) {
      return _this.QRCodeFile(item);
    };
    this.onClick = function(item, event) {
      var prevActiveProject;
      prevActiveProject = root.activeProject();
      if (prevActiveProject) {
        prevActiveProject.active(false);
        prevActiveProject.save();
      }
      _this.active(true);
      return _this.save();
    };
    this.onCompileCheckboxClick = function(item, event) {
      if (event.target.tagName.toLowerCase() === 'label') {
        setTimeout(_this.save, 100);
      }
      return true;
    };
    this.load = function(data) {
      _this.path(data.path);
      _this.active(!!data.active);
      _this.muteList(data.muteList || []);
      _this.targetHost(data.targetHost || "");
      _this.QRhost(data.QRhost || root.host());
      _this.compileLess(!!data.compileLess);
      _this.compileCoffee(!!data.compileCoffee);
      return _this.delay(parseFloat(data.delay) || 0.0);
    };
    this.save = function() {
      return API.project.update(_this);
    };
    this["export"] = function() {
      return {
        path: _this.path(),
        active: _this.active(),
        muteList: _this.muteList(),
        targetHost: _this.targetHost(),
        QRhost: _this.QRhost(),
        compileLess: _this.compileLess(),
        compileCoffee: _this.compileCoffee(),
        delay: parseFloat(_this.delay())
      };
    };
    if (data) {
      this.load(data);
    }
    return this;
  };

  ViewModel = function() {
    var _this = this;
    this.host = ko.observable(location.host);
    this.localHosts = ko.observableArray(['127.0.0.1']);
    this.projects = ko.observableArray([]);
    this.projects.subscribe(function(newValue) {
      return setTimeout(function() {
        return $('.project-box table .op a').tooltip();
      }, 500);
    });
    this.activeProject = ko.computed(function() {
      var project, _i, _len, _ref;
      _ref = _this.projects();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        project = _ref[_i];
        if (project.active()) {
          return project;
        }
      }
    });
    this.activeProject.subscribe(function(project) {
      return setTimeout(function() {
        return $('.project-box [data-toggle=tooltip]').tooltip();
      }, 500);
    });
    this.queryLocalHosts = function() {
      return API.os.localHosts(function(resp) {
        return _this.localHosts(resp.hosts);
      });
    };
    this.findProject = function(path) {
      var project, _i, _len, _ref;
      _ref = _this.projects();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        project = _ref[_i];
        if (project.path() === path) {
          return project;
        }
      }
    };
    this.loadProjectData = function(projectData) {
      var project;
      project = _this.findProject(projectData.path);
      if (project) {
        project.load(projectData);
      } else {
        project = new ProjectModel(projectData, _this);
        _this.projects.push(project);
      }
      return project;
    };
    this.queryProjects = function() {
      return API.project.list(function(data) {
        var projectData, _i, _len, _ref, _results;
        _ref = data['projects'];
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          projectData = _ref[_i];
          _results.push(_this.loadProjectData(projectData));
        }
        return _results;
      });
    };
    this.removeProject = function(project) {
      _this.projects.remove(project);
      return API.project.remove(project.path());
    };
    this.addProjectWithPath = function(path) {
      return API.project.add(path, function(resp) {
        _this.loadProjectData(resp.project);
        if (_this.projects().length === 1) {
          _this.projects().active(true);
        }
        return $('#new-path-input').val('');
      });
    };
    this.askRemoveProject = function(project, event) {
      if (confirm('是否确认【删除】该项目?')) {
        _this.removeProject(project);
      }
      return event.stopImmediatePropagation();
    };
    this.onSubmitProjectPath = function(formElement) {
      var $input, projectPath;
      $input = $('#new-path-input');
      projectPath = $.trim($input.val());
      $input.val(projectPath);
      if (projectPath) {
        return _this.addProjectWithPath(projectPath);
      } else {
        return alert('请输入路径');
      }
    };
    this.queryLocalHosts();
    this.queryProjects();
    return this;
  };

  $(function() {
    window.vm = new ViewModel();
    ko.applyBindings(vm);
    API.os.f5Version(function(resp) {
      if (resp.status === 'ok') {
        return $.getScript("http://www.getf5.com/update.js?ver=" + resp.version);
      }
    });
    
    (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
        (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
        m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
    })(window,document,'script','//www.google-analytics.com/analytics.js','ga');
    ;
    ga('create', 'UA-22253493-9', '127.0.0.1');
    return ga('send', 'pageview');
  });

}).call(this);
