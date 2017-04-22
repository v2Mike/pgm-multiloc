import {Map} from './map.ts';
import {Hive} from './hive.ts';
import {ICommandTemplate, config} from '../config.ts';

import * as $ from 'jquery';
import * as ko from 'knockout';
import * as _ from 'lodash';

export interface IViewModelOptions {
    map: Map;
}
export class ViewModel {
    private options: IViewModelOptions;
    public activeHives: KnockoutObservable<Hive[]>;
    public os: KnockoutObservable<string>;
    public accountsPerHive: KnockoutObservable<number>;
    public accountDirectory: KnockoutObservable<string>;
    public rocketmapDirectory: KnockoutObservable<string>;
    public scriptDelay: KnockoutObservable<number>;
    public filename: KnockoutObservable<string>;

    public serverCheckbox: KnockoutObservable<boolean>;
    public serverNoPokemon: KnockoutObservable<boolean>;
    public serverNoGyms: KnockoutObservable<boolean>;
    public serverNoPokestops: KnockoutObservable<boolean>;
    public serverSearchControl: KnockoutObservable<boolean>;
    public serverNoFixedLocation: KnockoutObservable<boolean>;
    public serverOptions: KnockoutComputed<string>;

    public alarmCheckbox: KnockoutObservable<boolean>;
    public alarmConfig: KnockoutObservable<boolean>;
    public alarmHost: KnockoutObservable<boolean>;
    public alarmPort: KnockoutObservable<boolean>;
    public alarmConfigValue: KnockoutObservable<string>;
    public alarmHostValue: KnockoutObservable<string>;
    public alarmPortValue: KnockoutObservable<number>;
    public alarmOptions: KnockoutComputed<string>;

    public webhookCheckbox: KnockoutObservable<boolean>;
    public snCheckbox: KnockoutObservable<boolean>;
    public webhookValue: KnockoutObservable<string>;
    public snValue: KnockoutObservable<string>;
    public disableClean: KnockoutObservable<boolean>;
    public workerNoPokemon: KnockoutObservable<boolean>;
    public workerNoGyms: KnockoutObservable<boolean>;
    public workerNoPokestops: KnockoutObservable<boolean>;
    public workerOptions: KnockoutComputed<string>;

    private windowsTemplates: Templates;
    private linuxTemplates: Templates;
    private screenTemplates: Templates;

    public activeTemplates: KnockoutObservable<Templates>;
    public generateScriptPreview: KnockoutComputed<string>;

    private invalidFields: KnockoutObservableArray<string>;
    private isValid: KnockoutComputed<boolean>;

    constructor(options: IViewModelOptions) {
        this.options = options;
        this.activeHives = ko.computed(() => this.getActiveHives());
        this.rocketmapDirectory = ko.observable(config.rocketmapDirectory);

        this.os = ko.observable(config.os);
        this.os.subscribe((newValue) => {
            this.invalidFields([]);

            if (this.os() === 'windows') {
                $('#rocketmap-directory').removeAttr('data-abide-ignore');
            }
            else {
                $('#rocketmap-directory').attr('data-abide-ignore', '');
            }

            _.forEach($('input,select,textarea', '#generate-ui'), (e) => $('#generate-ui').foundation('validateInput', $(e)));
        });

        this.serverCheckbox = ko.observable($('#serverCheckbox').is(':checked'));
        this.serverNoPokemon = ko.observable($('#no-pokemon').is(':checked'));
        this.serverNoGyms = ko.observable($('#no-gyms').is(':checked'));
        this.serverNoPokestops = ko.observable($('#no-pokestops').is(':checked'));
        this.serverSearchControl = ko.observable($('#search-control').is(':checked'));
        this.serverNoFixedLocation = ko.observable($('#no-fixed-location').is(':checked'));
        this.serverOptions = ko.computed(() => this.getServerOptions().toString());

        this.alarmCheckbox = ko.observable($('#alarmCheckbox').is(':checked'));
        this.alarmConfig = ko.observable($('#alarm-config').is(':checked'));
        this.alarmHost = ko.observable($('#alarm-host').is(':checked'));
        this.alarmPort = ko.observable($('#alarm-port').is(':checked'));
        this.alarmConfigValue = ko.observable('custom-alarms.json');
        this.alarmHostValue = ko.observable('127.0.0.1');
        this.alarmPortValue = ko.observable(4000);
        this.alarmOptions = ko.computed(() => this.getAlarmOptions().toString());

        this.accountsPerHive = ko.observable(0);
        this.accountDirectory = ko.observable(config.accountDirectory);
        this.scriptDelay = ko.observable(config.scriptDelay);

        this.webhookCheckbox = ko.observable($('#webhook-checkbox').is(':checked'));
        this.snCheckbox = ko.observable($('#sn-checkbox').is(':checked'));
        this.disableClean = ko.observable($('#disable-clean').is(':checked'));
        this.webhookValue = ko.observable('http://127.0.0.1:4000');
        this.snValue = ko.observable('HIVE{index}');
        this.workerNoPokemon = ko.observable($('#worker-no-pokemon').is(':checked'));
        this.workerNoGyms = ko.observable($('#worker-no-gyms').is(':checked'));
        this.workerNoPokestops = ko.observable($('#worker-no-pokestops').is(':checked'));
        this.workerOptions = ko.computed(() => this.getWorkerOptions().toString());

        this.windowsTemplates = new Templates(config.windowsTemplates);
        this.linuxTemplates = new Templates(config.linuxTemplates);
        this.activeTemplates = ko.computed(() => this.getActiveTemplates());

        this.generateScriptPreview = ko.computed(() => this.generateScriptOutput(true).replace(/\n/g, '<br />'));

        this.invalidFields = ko.observableArray([]);
        this.isValid = ko.computed(() => this.invalidFields().length === 0);
        this.isValid.subscribe((newValue) => {
            newValue ? $('#download').show() : $('#download').hide();
        });
        if (this.isValid) {
            $('#download').show();
        }

        $(document).on('valid.zf.abide invalid.zf.abide', ((e) => this.handleFormInputValidation(e)));
        $(document).on('formvalid.zf.abide forminvalid.zf.abide', ((e) => this.handleFormValidation(e)));
    }

    private handleFormInputValidation(e: JQueryEventObject): void {
        let name = $(e.target).attr('name');
        let existingIndex = this.invalidFields.indexOf(name);
        if (e.type === 'valid') {
            if (existingIndex >= 0) {
                this.invalidFields.splice(existingIndex, 1);
            }
        }
        else {
            if (existingIndex < 0) {
                this.invalidFields.push(name);
            }
        }
    }
    private handleFormValidation(e: JQueryEventObject): void {
        if (e.type === 'valid') {
            this.invalidFields([]);
        }
    }

    private getActiveHives(): Hive[] {
        return this.options.map.activeHives();
    }

    private getActiveTemplates(): Templates {
        return this.os() === 'windows' ? this.windowsTemplates : this.linuxTemplates;
    }

    private getServerOptions(): String {
        let serverOptions = '';
        if (this.serverCheckbox) {
            let np = this.serverNoPokemon() ? '-np ' : '';
            let ng = this.serverNoGyms() ? '-ng ' : '';
            let nk = this.serverNoPokestops() ? '-nk ' : '';
            let sc = this.serverSearchControl() ? '-sc ' : '';
            let nfl = this.serverNoFixedLocation() ? '-nfl' : '';
            serverOptions = np + ng + nk + sc + nfl;
        } else {
            serverOptions = '';
        }
        return serverOptions
    }

    private getAlarmOptions(): String {
        let alarmOptions = '';
        if (this.alarmCheckbox) {
            let ac = (this.alarmConfig() && this.alarmConfigValue()) ? '-a ' + this.alarmConfigValue().toString() : '';
            let ah = (this.alarmHost() && this.alarmHostValue()) ? ' -H ' + this.alarmHostValue().toString() : '';
            let ap = (this.alarmPort() && this.alarmPortValue()) ? ' -P ' + this.alarmPortValue().toString() : '';
            alarmOptions = ac + ah + ap;
        } else {
            alarmOptions = '';
        }
        return alarmOptions
    }

    private getWorkerOptions(): String {
        let workerOptions = '';
            let sn = (this.snCheckbox() && this.snValue()) ? '-sn ' + this.snValue().toString() : '';
            let wh = (this.webhookCheckbox() && this.webhookValue()) ? '-wh "' + this.webhookValue().toString() + '"': '';
            let dc = this.disableClean() ? ' --disable-clean ' : '';
            let wnp = this.workerNoPokemon() ? ' -np ' : '';
            let wng = this.workerNoGyms() ? ' -ng ' : '';
            let wnk = this.workerNoPokestops() ? ' -nk ' : '';
            workerOptions = sn + dc + wh + wnp + wng + wnk;

        return workerOptions
    }

    public generateScriptOutput(isPreview: boolean = true): string {
        let templates = this.activeTemplates();
        let hives = this.activeHives();
        if (hives.length <= 0) { return ''; }
        let sOptions = this.serverOptions();
        let aOptions = this.alarmOptions();
        let wOptions = this.workerOptions();

        let setupScript = `${templates.setup.value()}
`;
        let serverScript = this.serverCheckbox() === false ? '' : `${this.replaceVariables(templates.server.value(), {
            'rocketmap-directory': this.rocketmapDirectory(),
            location: hives[0].getCenter().toString(),
            'server-options': sOptions
        })}
`;
        let alarmScript = this.alarmCheckbox() === false ? '' : `${this.replaceVariables(templates.alarm.value(), {
            'alarm-options': aOptions
        })}
`;

        let workerScript = '';
        for (let i = 0; i < (isPreview ? 1 : hives.length); i++) {
            let sd = i < (hives.length - 1) ? this.scriptDelay() : 0;
            workerScript += `${this.replaceVariables(templates.worker.value(), {
                'rocketmap-directory': this.rocketmapDirectory(),
                'account-directory': this.accountDirectory(),
                location: hives[i].getCenter().toString(),
                steps: hives[i].steps,
                workers: this.accountsPerHive(),
                'worker-options': wOptions,
                index: i + 1
            })}
`;
          if (sd > 0) {
              workerScript += `${this.replaceVariables(templates.delay.value(), {
                  'script-delay': sd
              })}
`;
          }
        }

        return setupScript + serverScript + alarmScript + workerScript;
    }

    private replaceVariables(text: string, variables: any): string {
        _.forOwn(variables, (value, key) => text = text.replace(new RegExp(`{${key}}`, 'g'), value));

        return text;
    }

    public downloadFile (): void {
        let script = this.generateScriptOutput(false);
        this.downloadScript(script, this.activeTemplates().filename.value());
    }

    public updateAPH (): void {
        $('#workers').trigger('change');
    }

    public coordsFile (): void {
        let script = _.join(_.map(this.activeHives(), (h) => h.getCenter().toString()), '\n');
        this.downloadScript(script, 'coords.txt');
    }

    public downloadScript(script: string, filename: string): void {
        let blob = new Blob([script], { type: 'text/plain' });
        let url = window.URL.createObjectURL(blob);
        let a = $('<a>', { style: 'display: none;', download: filename, href: url });

        a.on('click', () => {
            setTimeout(() => {
                window.URL.revokeObjectURL(url);
                a.remove();
            }, 50);
        });

        $('#generate-ui').append(a);
        a[0].dispatchEvent(new MouseEvent('click'));
    }
}

export class Template {
    public value: KnockoutObservable<string>;
    public isDirty: KnockoutObservable<boolean>;

    constructor(public defaultValue: string) {
        this.value = ko.observable(defaultValue);
        this.isDirty = ko.observable(false);

        this.value.subscribe((newValue) => this.isDirty(true));
    }
}

export class Templates {
  public setup: Template;
  public alarm: Template;
  public server: Template;
  public worker: Template;
  public delay: Template;
  public filename: Template;

  constructor(defaults: ICommandTemplate) {
      this.setup = new Template(defaults.setup);
      this.alarm = new Template(defaults.alarm);
      this.server = new Template(defaults.server);
      this.worker = new Template(defaults.worker);
      this.delay = new Template(defaults.delay);
      this.filename = new Template(defaults.filename);
  }
}
