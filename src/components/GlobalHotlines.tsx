import { useState } from 'react';
import { Phone, Globe } from 'lucide-react';
import { Button } from './ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './ui/command';

interface Hotline {
  id: string;
  country: string;
  emergency?: string;
  suicide?: string;
  name?: string;
}

const HOTLINES: Hotline[] = [
  { id: 'us', country: 'United States', emergency: '911', suicide: '988', name: 'Suicide & Crisis Lifeline' },
  { id: 'algeria', country: 'Algeria', emergency: '34342 and 43', suicide: '0021 3983 2000 58' },
  { id: 'angola', country: 'Angola', emergency: '113' },
  { id: 'argentina', country: 'Argentina', emergency: '911', suicide: '135' },
  { id: 'armenia', country: 'Armenia', emergency: '911 and 112', suicide: '(2) 538194' },
  { id: 'australia', country: 'Australia', emergency: '000', suicide: '131114' },
  { id: 'austria', country: 'Austria', emergency: '112', suicide: '142', name: 'Telefonseelsorge' },
  { id: 'bahamas', country: 'Bahamas', emergency: '911', suicide: '(2) 322-2763' },
  { id: 'bahrain', country: 'Bahrain', emergency: '999' },
  { id: 'bangladesh', country: 'Bangladesh', emergency: '999' },
  { id: 'barbados', country: 'Barbados', emergency: '911', suicide: '(246) 4299999', name: 'Samaritan Barbados' },
  { id: 'belgium', country: 'Belgium', emergency: '112', suicide: '1813', name: 'Stichting Zelfmoordlijn' },
  { id: 'bolivia', country: 'Bolivia', emergency: '911', suicide: '3911270' },
  { id: 'bosnia', country: 'Bosnia & Herzegovina', suicide: '080 05 03 05' },
  { id: 'botswana', country: 'Botswana', emergency: '911', suicide: '+2673911270' },
  { id: 'brazil', country: 'Brazil', emergency: '188' },
  { id: 'bulgaria', country: 'Bulgaria', emergency: '112', suicide: '0035 9249 17 223' },
  { id: 'burundi', country: 'Burundi', emergency: '117' },
  { id: 'burkina', country: 'Burkina Faso', emergency: '17' },
  { id: 'canada', country: 'Canada', emergency: '911', suicide: '988' },
  { id: 'chad', country: 'Chad', emergency: '2251-1237' },
  { id: 'china', country: 'China', emergency: '110', suicide: '800-810-1117' },
  { id: 'colombia', country: 'Colombia', suicide: '(57-1) 323 24 25', name: 'Bogota Hotline' },
  { id: 'congo', country: 'Congo', emergency: '117' },
  { id: 'costa-rica', country: 'Costa Rica', emergency: '911', suicide: '506-253-5439' },
  { id: 'croatia', country: 'Croatia', emergency: '112' },
  { id: 'cyprus', country: 'Cyprus', emergency: '112', suicide: '8000 7773' },
  { id: 'czech', country: 'Czech Republic', emergency: '112' },
  { id: 'denmark', country: 'Denmark', emergency: '112', suicide: '4570201201' },
  { id: 'dominican', country: 'Dominican Republic', emergency: '911', suicide: '(809) 562-3500' },
  { id: 'ecuador', country: 'Ecuador', emergency: '911' },
  { id: 'egypt', country: 'Egypt', emergency: '122', suicide: '131114' },
  { id: 'el-salvador', country: 'El Salvador', emergency: '911', suicide: '126' },
  { id: 'equatorial', country: 'Equatorial Guinea', emergency: '114' },
  { id: 'estonia', country: 'Estonia', emergency: '112', suicide: '3726558088' },
  { id: 'ethiopia', country: 'Ethiopia', emergency: '911' },
  { id: 'finland', country: 'Finland', emergency: '112', suicide: '010 195 202' },
  { id: 'france', country: 'France', emergency: '112', suicide: '0145394000' },
  { id: 'germany', country: 'Germany', emergency: '112', suicide: '0800 111 0 111' },
  { id: 'ghana', country: 'Ghana', emergency: '999', suicide: '2332 444 71279' },
  { id: 'greece', country: 'Greece', emergency: '1018' },
  { id: 'guatemala', country: 'Guatemala', emergency: '110', suicide: '5392-5953' },
  { id: 'guinea', country: 'Guinea', emergency: '117' },
  { id: 'guinea-bissau', country: 'Guinea Bissau', emergency: '117' },
  { id: 'guyana', country: 'Guyana', emergency: '999', suicide: '223-0001' },
  { id: 'holland', country: 'Holland', suicide: '09000767' },
  { id: 'hong-kong', country: 'Hong Kong', emergency: '999', suicide: '852 2382 0000' },
  { id: 'hungary', country: 'Hungary', emergency: '112', suicide: '116123' },
  { id: 'india', country: 'India', emergency: '112', suicide: '8888817666' },
  { id: 'indonesia', country: 'Indonesia', emergency: '112', suicide: '1-800-273-8255' },
  { id: 'iran', country: 'Iran', emergency: '110', suicide: '1480' },
  { id: 'ireland', country: 'Ireland', emergency: '116123', suicide: '+4408457909090' },
  { id: 'israel', country: 'Israel', emergency: '100', suicide: '1201' },
  { id: 'italy', country: 'Italy', emergency: '112', suicide: '800860022' },
  { id: 'jamaica', country: 'Jamaica', suicide: '1-888-429-5273', name: 'KARE' },
  { id: 'japan', country: 'Japan', emergency: '110', suicide: '810352869090' },
  { id: 'jordan', country: 'Jordan', emergency: '911', suicide: '110' },
  { id: 'kenya', country: 'Kenya', emergency: '999', suicide: '722178177' },
  { id: 'kuwait', country: 'Kuwait', emergency: '112', suicide: '94069304' },
  { id: 'latvia', country: 'Latvia', emergency: '113', suicide: '371 67222922' },
  { id: 'lebanon', country: 'Lebanon', suicide: '1564' },
  { id: 'liberia', country: 'Liberia', emergency: '911', suicide: '6534308' },
  { id: 'lithuania', country: 'Lithuania', emergency: '112', suicide: '8 800 28888' },
  { id: 'luxembourg', country: 'Luxembourg', emergency: '112', suicide: '352 45 45 45' },
  { id: 'madagascar', country: 'Madagascar', emergency: '117' },
  { id: 'malaysia', country: 'Malaysia', emergency: '999', suicide: '(06) 2842500' },
  { id: 'mali', country: 'Mali', emergency: '8000-1115' },
  { id: 'malta', country: 'Malta', suicide: '179' },
  { id: 'mauritius', country: 'Mauritius', emergency: '112', suicide: '+230 800 93 93' },
  { id: 'mexico', country: 'Mexico', emergency: '911', suicide: '5255102550' },
  { id: 'netherlands', country: 'Netherlands', emergency: '112', suicide: '900 0113' },
  { id: 'new-zealand', country: 'New Zealand', emergency: '111', suicide: '1737' },
  { id: 'niger', country: 'Niger', emergency: '112' },
  { id: 'nigeria', country: 'Nigeria', suicide: '234 8092106493' },
  { id: 'norway', country: 'Norway', emergency: '112', suicide: '+4781533300' },
  { id: 'pakistan', country: 'Pakistan', emergency: '115' },
  { id: 'peru', country: 'Peru', emergency: '911', suicide: '381-3695' },
  { id: 'philippines', country: 'Philippines', emergency: '911', suicide: '028969191' },
  { id: 'poland', country: 'Poland', emergency: '112', suicide: '5270000' },
  { id: 'portugal', country: 'Portugal', emergency: '112', suicide: '21 854 07 40' },
  { id: 'qatar', country: 'Qatar', emergency: '999' },
  { id: 'romania', country: 'Romania', emergency: '112', suicide: '0800 801200' },
  { id: 'russia', country: 'Russia', emergency: '112', suicide: '0078202577577' },
  { id: 'saint-vincent', country: 'Saint Vincent and the Grenadines', suicide: '9784 456 1044' },
  { id: 'sao-tome', country: 'São Tomé and Príncipe', suicide: '(239) 222-12-22 ext. 123' },
  { id: 'saudi', country: 'Saudi Arabia', emergency: '112' },
  { id: 'serbia', country: 'Serbia', suicide: '(+381) 21-6623-393' },
  { id: 'senegal', country: 'Senegal', emergency: '17' },
  { id: 'singapore', country: 'Singapore', emergency: '999', suicide: '1 800 2214444' },
  { id: 'spain', country: 'Spain', emergency: '112', suicide: '914590050' },
  { id: 'south-africa', country: 'South Africa', emergency: '10111', suicide: '0514445691' },
  { id: 'south-korea', country: 'South Korea', emergency: '112', suicide: '(02) 7158600' },
  { id: 'sri-lanka', country: 'Sri Lanka', suicide: '011 057 2222662' },
  { id: 'sudan', country: 'Sudan', suicide: '(249) 11-555-253' },
  { id: 'sweden', country: 'Sweden', emergency: '112', suicide: '46317112400' },
  { id: 'switzerland', country: 'Switzerland', emergency: '112', suicide: '143' },
  { id: 'tanzania', country: 'Tanzania', emergency: '112' },
  { id: 'thailand', country: 'Thailand', suicide: '(02) 713-6793' },
  { id: 'tonga', country: 'Tonga', suicide: '23000' },
  { id: 'trinidad', country: 'Trinidad and Tobago', suicide: '(868) 645 2800' },
  { id: 'tunisia', country: 'Tunisia', emergency: '197' },
  { id: 'turkey', country: 'Turkey', emergency: '112' },
  { id: 'uganda', country: 'Uganda', emergency: '112', suicide: '0800 21 21 21' },
  { id: 'uae', country: 'United Arab Emirates', suicide: '800 46342' },
  { id: 'uk', country: 'United Kingdom', emergency: '999', suicide: '0800 689 5652' },
  { id: 'zambia', country: 'Zambia', emergency: '999', suicide: '+260960264040' },
  { id: 'zimbabwe', country: 'Zimbabwe', emergency: '999', suicide: '080 12 333 333' },
];

export const GlobalHotlines = () => {
  const [open, setOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Hotline | null>(null);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-primary/20 hover:border-primary/40"
          aria-label="Global Crisis Hotlines"
        >
          <Phone className="h-4 w-4" />
          <Globe className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[450px] p-0 z-50 bg-card border shadow-lg" align="end">
        <Command className="bg-card">
          <CommandInput placeholder="Search country..." className="bg-background" />
          <CommandList className="max-h-[450px] bg-card">
            <CommandEmpty className="bg-card">
              No country found.
            </CommandEmpty>
            <CommandGroup heading="Crisis Hotlines (24/7)" className="bg-card">
              {HOTLINES.map((hotline) => (
                <CommandItem
                  key={hotline.id}
                  onSelect={() => {
                    setSelectedCountry(hotline);
                  }}
                  className="cursor-pointer bg-card hover:bg-accent"
                >
                  <div className="flex-1 py-1.5">
                    <div className="font-semibold text-foreground mb-1">{hotline.country}</div>
                    {hotline.emergency && (
                      <div className="text-xs text-muted-foreground">
                        Emergency: <a href={`tel:${hotline.emergency}`} className="text-primary hover:underline font-medium" onClick={(e) => e.stopPropagation()}>{hotline.emergency}</a>
                      </div>
                    )}
                    {hotline.suicide && (
                      <div className="text-xs text-muted-foreground">
                        Suicide Hotline: <a href={`tel:${hotline.suicide}`} className="text-primary hover:underline font-medium" onClick={(e) => e.stopPropagation()}>{hotline.suicide}</a>
                      </div>
                    )}
                    {hotline.name && (
                      <div className="text-xs text-muted-foreground mt-0.5 italic">
                        {hotline.name}
                      </div>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
