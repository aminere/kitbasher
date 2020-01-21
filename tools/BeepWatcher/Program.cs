using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Media;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace BeepWatcher
{
    class Program
    {
        static ManualResetEvent _quitEvent = new ManualResetEvent(false);
        static void Main(string[] args)
        {
            var watcher = new FileSystemWatcher();
            watcher.Path = ".";
            watcher.NotifyFilter = NotifyFilters.LastWrite;
            watcher.Filter = "*.js";
            watcher.Changed += new FileSystemEventHandler((object sender, FileSystemEventArgs e) =>
            {
                Console.WriteLine(string.Format("{0} changed at {1}", e.FullPath, DateTime.Now.ToShortTimeString()));
                SystemSounds.Hand.Play();
            });
            Console.WriteLine(string.Format("Watching changes in {0}...", watcher.Path));
            watcher.EnableRaisingEvents = true;

            Console.CancelKeyPress += (sender, eArgs) =>
            {
                _quitEvent.Set();
                eArgs.Cancel = true;
            };

            _quitEvent.WaitOne();
        }
    }
}
