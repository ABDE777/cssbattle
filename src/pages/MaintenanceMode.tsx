import { useEffect, useState } from "react";
import { Settings, AlertTriangle, Power } from "lucide-react";
import FloatingShape from "@/components/FloatingShape";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/contexts/AdminContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const MaintenanceMode = () => {
  const [message, setMessage] = useState(
    "The platform is currently undergoing maintenance"
  );
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch custom maintenance message if available
    const fetchMessage = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("maintenance_message")
        .eq("id", 1)
        .single();

      if (data?.maintenance_message) {
        setMessage(data.maintenance_message);
      }
    };
    fetchMessage();
  }, []);

  const disableMaintenanceMode = async () => {
    const { error } = await supabase
      .from("site_settings")
      .update({ maintenance_mode: false })
      .eq("id", 1);

    if (!error) {
      // Redirect to admin dashboard
      navigate("/admin/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-battle-dark via-battle-darker to-black text-white relative overflow-hidden">
      <FloatingShape size={400} color="purple" top="10%" left="5%" delay={0} />
      <FloatingShape size={250} color="purple" top="60%" left="80%" delay={2} />
      <FloatingShape size={150} color="pink" top="80%" left="10%" delay={4} />

      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <div className="max-w-2xl w-full text-center space-y-8">
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-battle-purple/30 blur-3xl rounded-full animate-pulse"></div>
              <div className="relative bg-gradient-primary rounded-full p-6">
                <Settings
                  className="w-20 h-20 text-white animate-spin"
                  style={{ animationDuration: "3s" }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3">
              <AlertTriangle className="w-8 h-8 text-yellow-400" />
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Maintenance Mode
              </h1>
            </div>

            <p className="text-xl md:text-2xl text-gray-300">{message}</p>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6 mt-8">
              <p className="text-gray-400">
                We're working hard to improve your experience. The platform will
                be back online shortly.
              </p>
              <p className="text-gray-400 mt-4">Thank you for your patience!</p>
            </div>

            {isAdmin && (
              <div className="mt-8">
                <Button
                  onClick={disableMaintenanceMode}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 mx-auto"
                >
                  <Power className="w-5 h-5" />
                  Disable Maintenance Mode
                </Button>
              </div>
            )}

            <div className="mt-12">
              <div className="flex justify-center gap-2">
                <div
                  className="w-3 h-3 bg-battle-purple rounded-full animate-bounce"
                  style={{ animationDelay: "0s" }}
                ></div>
                <div
                  className="w-3 h-3 bg-battle-purple rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
                <div
                  className="w-3 h-3 bg-battle-purple rounded-full animate-bounce"
                  style={{ animationDelay: "0.4s" }}
                ></div>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/10">
            <img
              src="/ofppt logo.png"
              alt="OFPPT Logo"
              className="h-16 mx-auto opacity-70"
            />
            <p className="text-sm text-gray-500 mt-4">
              OFPPT Learning Platform
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceMode;
