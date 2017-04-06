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
    public filename: KnockoutObservable<string>;

    public serverCheckbox: KnockoutObservable<boolean>;
    public alarmCheckbox: KnockoutObservable<boolean>;
    public scriptDelay: KnockoutObservable<number>;

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
        this.alarmCheckbox = ko.observable($('#alarmCheckbox').is(':checked'));
        this.scriptDelay = ko.observable(config.scriptDelay);

        this.accountsPerHive = ko.observable(0);
        this.accountDirectory = ko.observable(config.accountDirectory);

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

    public generateScriptOutput(isPreview: boolean = true): string {
        let templates = this.activeTemplates();
        let hives = this.activeHives();
        if (hives.length <= 0) { return ''; }

        let setupScript = `${templates.setup.value()}
`;
        let serverScript = this.serverCheckbox() === false ? '' : `${this.replaceVariables(templates.server.value(), {
            'rocketmap-directory': this.rocketmapDirectory(),
            location: hives[0].getCenter().toString()
        })}
`;
        let alarmScript = this.alarmCheckbox() === false ? '' : `${templates.alarm.value()}
`;

        let workerScript = '';
        for (let i = 0; i < (isPreview ? 1 : hives.length); i++) {
            workerScript += `${this.replaceVariables(templates.worker.value(), {
                'rocketmap-directory': this.rocketmapDirectory(),
                'account-directory': this.accountDirectory(),
                index: i + 1,
                location: hives[i].getCenter().toString(),
                steps: hives[i].steps,
                workers: this.accountsPerHive()
            })}
${this.replaceVariables(templates.delay.value(), {
    'script-delay': this.scriptDelay()
})}
`;
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
